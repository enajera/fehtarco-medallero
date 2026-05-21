import { PhaseName } from '@prisma/client';
import prisma from './prisma';
import { ResultItemInput, UpdateResultInput } from '../validation/schemas';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { deriveMedal, Medal } from '../utils/medals';
import { medalService } from './medal.service';

// ============================================
// RESULT SERVICE
// ============================================

interface ResultFilters {
  categoryId?: number;
  modalityId?: number;
  phase?: PhaseName;
}

interface ResultWithMedal {
  id: number;
  eventCategoryId: number;
  phaseId: number;
  athleteId: number;
  score: number;
  position: number;
  notes: string | null;
  medal: Medal;
  phase: {
    id: number;
    name: PhaseName;
  };
  athlete: {
    id: number;
    firstName: string;
    lastName: string;
    clubId: number | null;
    club: { id: number; name: string } | null;
  };
  // eventCategory distance is included for frontend display
  eventCategory?: {
    distance?: string | null;
  };
}

export class ResultService {
  // Simple in-memory cache for summary responses (keyed by eventId)
  private summaryCache: Record<number, { ts: number; data: any }> = {};
  private SUMMARY_TTL_MS = Number(process.env.RESULT_CACHE_TTL_MS || '8000');

  private getCachedSummary(eventId: number) {
    const e = this.summaryCache[eventId];
    if (!e) return null;
    if (Date.now() - e.ts > this.SUMMARY_TTL_MS) {
      delete this.summaryCache[eventId];
      return null;
    }
    return e.data;
  }

  private setCachedSummary(eventId: number, data: any) {
    this.summaryCache[eventId] = { ts: Date.now(), data };
  }

  // Invalidate entire summary cache (safe, called after mutations)
  private clearSummaryCache() {
    this.summaryCache = {};
  }

  /**
   * Get results for an event with filters
   */
  async findByEvent(eventId: number, filters: ResultFilters & { distance?: string; eventCategoryId?: number }, pagination?: { page?: number; limit?: number }): Promise<{ results: ResultWithMedal[]; total: number }> {
    const { categoryId, modalityId, phase, distance, eventCategoryId } = filters as any;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 200;
    const skip = (page - 1) * limit;

    // Build phaseId if provided
    let phaseId: number | undefined;
    if (phase) {
      const phaseRecord = await prisma.phase.findUnique({ where: { name: phase } });
      phaseId = phaseRecord?.id;
    }

    // Build base where clause for results by joining eventCategory directly to avoid separate query for ids
    const where: any = {
      eventCategory: { eventId: eventId },
      ...(phaseId && { phaseId }),
    };

    if (eventCategoryId) {
      // ensure the provided eventCategory belongs to event
      const ec = await prisma.eventCategory.findUnique({ where: { id: eventCategoryId } });
      if (!ec || ec.eventId !== eventId) return { results: [], total: 0 } as any;
      if (distance && ec.distance !== distance) return { results: [], total: 0 } as any;
      where.eventCategoryId = eventCategoryId;
    } else {
      if (categoryId) where.eventCategory = { ...where.eventCategory, categoryId };
      if (modalityId) where.eventCategory = { ...where.eventCategory, modalityId };
      if (distance) where.eventCategory = { ...where.eventCategory, distance };
    }

    // Get total count and results using the constructed where clause
    const total = await prisma.result.count({ where });

    const results = await prisma.result.findMany({
      where,
      include: {
        phase: true,
        athlete: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
        eventCategory: {
          select: { id: true, distance: true, category: true, modality: true },
        },
      },
      orderBy: [
        { eventCategoryId: 'asc' },
        { phaseId: 'asc' },
        { position: 'asc' },
      ],
      skip,
      take: limit,
    });

    // Add derived medal to each result
    const mapped = results.map((result) => ({
      ...result,
      medal: deriveMedal(result.phase.name, result.position),
    }));

    return { results: mapped, total };
  }

  /**
   * Lightweight summary: fetch all results for an event with minimal joins and return grouped by eventCategory.
   * This avoids multiple round-trips and heavy per-category queries on the frontend.
   */
  async findByEventSummary(eventId: number) {
    // Return cached summary when available (reduces DB load and dramatically improves latency for repeated requests)
    const cached = this.getCachedSummary(eventId);
    if (cached) return cached;

    // Fetch results for event with necessary joins in a single query
    const rows = await prisma.result.findMany({
      where: {
        eventCategory: { eventId },
      },
      // Select only minimal fields needed by the admin results UI to reduce payload and join cost
      select: {
        id: true,
        eventCategoryId: true,
        phase: { select: { id: true, name: true, orderIndex: true } },
        athlete: { select: { id: true, firstName: true, lastName: true, club: { select: { id: true, name: true } } } },
        score: true,
        position: true,
        eventCategory: {
          select: {
            id: true,
            distance: true,
            // include category bowType/gender/division used for ordering and labels
            category: { select: { id: true, bowType: true, gender: true, division: true } },
            modality: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { eventCategoryId: 'asc' },
        { phase: { orderIndex: 'asc' } },
        { position: 'asc' },
      ],
    });

    // Group by eventCategoryId
    const map: Record<number, any> = {};
    for (const r of rows) {
      const ecId = r.eventCategoryId;
      if (!map[ecId]) {
        map[ecId] = {
          eventCategoryId: ecId,
          distance: r.eventCategory?.distance ?? null,
          category: r.eventCategory?.category ?? null,
          modality: r.eventCategory?.modality ?? null,
          results: [],
        };
      }
      map[ecId].results.push({
        id: r.id,
        athlete: {
          id: r.athlete.id,
          firstName: r.athlete.firstName,
          lastName: r.athlete.lastName,
          club: r.athlete.club ? { id: r.athlete.club.id, name: r.athlete.club.name } : null,
        },
        phase: r.phase,
        score: r.score,
        position: r.position,
      });
    }

    // Convert map to array
    const grouped = Object.values(map);

    // cache grouped result
    this.setCachedSummary(eventId, grouped);

    return grouped;
  }

  /**
   * Create multiple results (bulk insert)
   */
  async createBulk(items: ResultItemInput[]) {
    const results = [];

    for (const item of items) {
      // Get phase by name
      const phase = await prisma.phase.findUnique({
        where: { name: item.phaseName },
      });

      if (!phase) {
        throw new BadRequestError(`Invalid phase: ${item.phaseName}`);
      }

      // Check eventCategory exists
      const eventCategory = await prisma.eventCategory.findUnique({
        where: { id: item.eventCategoryId },
      });

      if (!eventCategory) {
        throw new BadRequestError(`Invalid eventCategoryId: ${item.eventCategoryId}`);
      }

      // Check athlete exists
      const athlete = await prisma.athlete.findUnique({
        where: { id: item.athleteId },
      });

      if (!athlete) {
        throw new BadRequestError(`Invalid athleteId: ${item.athleteId}`);
      }

      // Create or update result
      let result;
      try {
        result = await prisma.result.upsert({
          where: {
            eventCategoryId_phaseId_athleteId: {
              eventCategoryId: item.eventCategoryId,
              phaseId: phase.id,
              athleteId: item.athleteId,
            },
          },
          update: {
            score: item.score,
            position: item.position,
            notes: item.notes,
          },
          create: {
            eventCategoryId: item.eventCategoryId,
            phaseId: phase.id,
            athleteId: item.athleteId,
            score: item.score,
            position: item.position,
            notes: item.notes,
          },
          include: {
            phase: true,
            athlete: {
              include: {
                club: { select: { id: true, name: true } },
              },
            },
          },
        });
      } catch (err: any) {
        // If upsert fails, log the error for debugging
        console.error('[ResultService] Upsert failed:', {
          eventCategoryId: item.eventCategoryId,
          phaseId: phase.id,
          athleteId: item.athleteId,
          errorCode: err.code,
          errorMessage: err.message,
        });
        
        // Try to get existing result to check if it exists
        const existing = await prisma.result.findUnique({
          where: {
            eventCategoryId_phaseId_athleteId: {
              eventCategoryId: item.eventCategoryId,
              phaseId: phase.id,
              athleteId: item.athleteId,
            },
          },
        });

        if (existing) {
          // Record exists, update it
          result = await prisma.result.update({
            where: { id: existing.id },
            data: {
              score: item.score,
              position: item.position,
              notes: item.notes,
            },
            include: {
              phase: true,
              athlete: {
                include: {
                  club: { select: { id: true, name: true } },
                },
              },
            },
          });
        } else {
          // Record doesn't exist, create it
          result = await prisma.result.create({
            data: {
              eventCategoryId: item.eventCategoryId,
              phaseId: phase.id,
              athleteId: item.athleteId,
              score: item.score,
              position: item.position,
              notes: item.notes,
            },
            include: {
              phase: true,
              athlete: {
                include: {
                  club: { select: { id: true, name: true } },
                },
              },
            },
          });
        }
      }

      results.push({
        ...result,
        medal: deriveMedal(result.phase.name, result.position),
      });
    }

    // After all results processed, invalidate medallero cache
    try { medalService.clearCache(); } catch (e) {}

  // Invalidate summary cache so subsequent reads reflect the changes
  try { this.clearSummaryCache(); } catch (e) {}

    return results;
  }

  /**
   * Update a single result
   */
  async update(id: number, input: UpdateResultInput) {
    const result = await prisma.result.findUnique({
      where: { id },
      include: { phase: true },
    });

    if (!result) {
      throw new NotFoundError('Result');
    }

    const updated = await prisma.result.update({
      where: { id },
      data: input,
      include: {
        phase: true,
        athlete: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
      },
    });

    try { medalService.clearCache(); } catch (e) {}

  // Invalidate summary cache
  try { this.clearSummaryCache(); } catch (e) {}

    return {
      ...updated,
      medal: deriveMedal(updated.phase.name, updated.position),
    };
  }

  /**
   * Delete a result
   */
  async delete(id: number) {
    const result = await prisma.result.findUnique({ where: { id } });

    if (!result) {
      throw new NotFoundError('Result');
    }

    const deleted = await prisma.result.delete({ where: { id } });
    // Invalidate summary cache
    try { this.clearSummaryCache(); } catch (e) {}
    return deleted;
  }
}

export const resultService = new ResultService();
