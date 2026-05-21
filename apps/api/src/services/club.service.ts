import prisma from './prisma';
import { CreateClubInput, UpdateClubInput } from '../validation/schemas';
import { NotFoundError } from '../utils/errors';

// ============================================
// CLUB SERVICE
// ============================================

// Fields to select in list/detail queries — excludes heavy logoData bytes
const CLUB_SELECT = {
  id: true,
  name: true,
  abbreviation: true,
  city: true,
  active: true,
  logoUrl: true,
  logoMimeType: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ClubService {
  /**
   * Get all clubs with optional search and pagination
   */
  async findAll(options?: { q?: string; page?: number; limit?: number; includeInactive?: boolean }) {
    const { q, page = 1, limit = 20, includeInactive = false } = options || {};
    const skip = (page - 1) * limit;

    const where: any = includeInactive ? {} : { active: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rawClubs, total] = await Promise.all([
      (prisma.club.findMany as any)({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          ...CLUB_SELECT,
          _count: { select: { athletes: true } },
        },
      }),
      prisma.club.count({ where }),
    ]);

    const clubs = rawClubs.map((c: any) => ({
      ...c,
      hasLogo: c.logoMimeType !== null && c.logoMimeType !== undefined,
    }));

    return { clubs, total, page, limit };
  }

  /**
   * Get club by ID
   */
  async findById(id: number) {
    const raw = await (prisma.club.findUnique as any)({
      where: { id },
      select: {
        ...CLUB_SELECT,
        athletes: {
          where: { active: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bowType: true,
            photoUrl: true,
            photoMimeType: true,
          },
          orderBy: { lastName: 'asc' },
        },
        _count: { select: { athletes: true } },
      },
    });

    if (!raw) {
      throw new NotFoundError('Club');
    }

    return {
      ...raw,
      hasLogo: raw.logoMimeType !== null && raw.logoMimeType !== undefined,
      athletes: raw.athletes.map((a: any) => ({
        ...a,
        hasPhoto: a.photoMimeType !== null && a.photoMimeType !== undefined,
      })),
    };
  }

  /**
   * Create a new club
   */
  async create(input: CreateClubInput) {
    return prisma.club.create({
      data: input,
    });
  }

  /**
   * Update a club
   */
  async update(id: number, input: UpdateClubInput) {
    const club = await prisma.club.findUnique({ where: { id } });
    
    if (!club) {
      throw new NotFoundError('Club');
    }

    return prisma.club.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Soft delete a club (set active = false)
   */
  async delete(id: number) {
    const club = await prisma.club.findUnique({ where: { id } });
    
    if (!club) {
      throw new NotFoundError('Club');
    }

    return prisma.club.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Upload logo — store raw bytes in BYTEA column
   */
  async uploadLogo(id: number, buffer: Buffer, mimeType: string) {
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundError('Club');

    return (prisma.club.update as any)({
      where: { id },
      data: { logoData: buffer, logoMimeType: mimeType },
      select: { id: true, name: true, logoMimeType: true },
    });
  }

  /**
   * Get stored logo bytes + mimeType, or null
   */
  async getLogo(id: number) {
    const row = await (prisma.club.findUnique as any)({
      where: { id },
      select: { logoData: true, logoMimeType: true },
    });
    if (!row || !row.logoData) return null;
    return { logoData: row.logoData as Buffer, logoMimeType: (row.logoMimeType as string) || 'image/png' };
  }

  /**
   * Delete stored logo
   */
  async deleteLogo(id: number) {
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundError('Club');
    return (prisma.club.update as any)({
      where: { id },
      data: { logoData: null, logoMimeType: null },
      select: { id: true, name: true },
    });
  }
}

export const clubService = new ClubService();

