import { BowType, Gender } from '@prisma/client';
import prisma from './prisma';
import { CreateAthleteInput, UpdateAthleteInput } from '../validation/schemas';
import { NotFoundError } from '../utils/errors';
import { medalService } from './medal.service';

// ============================================
// ATHLETE SERVICE
// ============================================

interface AthleteFilters {
  clubId?: number;
  q?: string;
  active?: boolean;
  bowType?: BowType;
  gender?: Gender;
  page?: number;
  limit?: number;
}

export class AthleteService {
  /**
   * Get all athletes with filters and pagination
   */
  async findAll(filters: AthleteFilters) {
    const { clubId, q, active, bowType, gender, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: {
      clubId?: number | null;
      active?: boolean;
      bowType?: BowType;
      gender?: Gender;
      OR?: Array<{ firstName: { contains: string; mode: 'insensitive' } } | { lastName: { contains: string; mode: 'insensitive' } }>;
    } = {};

    if (clubId !== undefined) {
      where.clubId = clubId === 0 ? null : clubId; // 0 = independientes
    }
    if (active !== undefined) where.active = active;
    if (bowType) where.bowType = bowType;
    if (gender) where.gender = gender;
    
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rawAthletes, total] = await Promise.all([
      prisma.athlete.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          gender: true,
          clubId: true,
          phone: true,
          email: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          bloodType: true,
          bowType: true,
          drawWeightLbs: true,
          drawLengthIn: true,
          active: true,
          photoUrl: true,
          photoMimeType: true,
          // Exclude photoData (heavy BYTEA) — use GET /athletes/:id/photo endpoint instead
          clubHistory: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          club: {
            select: { id: true, name: true },
          },
          // Virtual field: does this athlete have a stored photo?
          _count: false,
        },
      }),
      prisma.athlete.count({ where }),
    ]);

    // Attach hasPhoto flag without sending the raw bytes
    const athletes = (rawAthletes as any[]).map((a) => ({
      ...a,
      hasPhoto: a.photoMimeType !== null && a.photoMimeType !== undefined,
    }));

    return { athletes, total, page, limit };
  }

  /**
   * Get athlete by ID with full details
   */
  async findById(id: number) {
    const raw = await (prisma.athlete.findUnique as any)({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        clubId: true,
        phone: true,
        email: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        bloodType: true,
        bowType: true,
        drawWeightLbs: true,
        drawLengthIn: true,
        active: true,
        photoUrl: true,
        photoMimeType: true,
        // Exclude photoData bytes — use GET /athletes/:id/photo endpoint
        clubHistory: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    if (!raw) {
      throw new NotFoundError('Athlete');
    }

    return {
      ...raw,
      hasPhoto: raw.photoMimeType !== null && raw.photoMimeType !== undefined,
    };
  }

  /**
   * Create a new athlete
   */
  async create(input: CreateAthleteInput) {
    const data: any = {
      ...input,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
    };
    // Prisma create expects undefined instead of null for optional relations
    if (data.clubId === null) delete data.clubId;
    if (data.clubHistory === undefined) delete data.clubHistory;

    return prisma.athlete.create({
      data,
      include: {
        club: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Update an athlete
   */
  async update(id: number, input: UpdateAthleteInput) {
    const athlete = await prisma.athlete.findUnique({ where: { id } });
    
    if (!athlete) {
      throw new NotFoundError('Athlete');
    }

    const data: any = {
      ...input,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
    };
    if (data.clubId === null) delete data.clubId;
    if (data.clubHistory === undefined) delete data.clubHistory;

    const updated = await prisma.athlete.update({
      where: { id },
      data,
      include: {
        club: {
          select: { id: true, name: true },
        },
      },
    });
    
    // Invalidate medallero cache because athlete clubHistory or club may have changed
    try {
      medalService.clearCache();
    } catch (e) {
      // ignore
    }

    return updated;
  }

  /**
   * Soft delete an athlete (set active = false)
   */
  async delete(id: number) {
    const athlete = await prisma.athlete.findUnique({ where: { id } });
    
    if (!athlete) {
      throw new NotFoundError('Athlete');
    }

    return prisma.athlete.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Delete stored photo for an athlete
   */
  async deletePhoto(id: number) {
    const athlete = await prisma.athlete.findUnique({ where: { id } });
    if (!athlete) {
      throw new NotFoundError('Athlete');
    }
    return (prisma.athlete.update as any)({
      where: { id },
      data: { photoData: null, photoMimeType: null },
      select: { id: true, firstName: true, lastName: true },
    });
  }
}

export const athleteService = new AthleteService();
