import { PhaseName, TechnicalLevel } from '@prisma/client';
import prisma from './prisma';
import { deriveMedal, calculateWeightedPoints, Medal } from '../utils/medals';

// ============================================
// MEDAL SERVICE (Medallero calculation)
// ============================================

interface ClubMedalCount {
  clubId: number;
  clubName: string;
  logoUrl: string | null;
  hasLogo?: boolean;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
  // contributions: list of medal contributions that explain the counts
  contributions?: Array<{
    eventId: number;
    eventName?: string;
    eventDate?: string;
    athleteId: number;
    athleteName?: string;
    medal: 'GOLD' | 'SILVER' | 'BRONZE';
    phaseName?: string;
  }>;
}

interface MedalFilters {
  year?: number;
  scope?: 'national' | 'all';
}

interface AthleteRankEntry {
  athleteId: number;
  firstName: string;
  lastName: string;
  bowType: string | null;
  gender: string | null;
  clubName: string | null;
  hasPhoto: boolean;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
}

export class MedalService {
  // simple in-memory cache to speed up repeated medallero requests in short intervals
  private medalleroCache: Map<string, { ts: number; data: ClubMedalCount[] }> = new Map();
  private cacheTtlMs = 15 * 1000; // 15 seconds

  // Clear medallero cache (call when results/athletes change)
  clearCache() {
    this.medalleroCache.clear();
  }

  /**
   * Get Club Medallero (National ranking)
   * 
   * Rules:
   * - Only events with clubMedalsEnabled = true
   * - Only technicalLevel in (WA_STANDARD, INDOOR_STANDARD)
   * - Only official distances (50m, 70m, INDOOR) - NO 30m
   * - Only RECURVE and COMPOUND categories - NO BAREBOW
   * - Exclude athletes with clubId = null (independientes)
   * - Medals derived from phase + position
   */
  async getClubMedallero(filters: MedalFilters): Promise<ClubMedalCount[]> {
    const { year, scope = 'national' } = filters;

    // Try to get medallero for the requested year
    let medallero = await this.getClubMedalleroForYear(year, scope);

    // If no data for the requested year and year was specified, try previous year
    if (medallero.length === 0 && year) {
      const previousYear = year - 1;
      medallero = await this.getClubMedalleroForYear(previousYear, scope);
    }

    return medallero;
  }

  /**
   * Get Club Medallero for a specific year
   */
  private async getClubMedalleroForYear(year: number | undefined, scope: string): Promise<ClubMedalCount[]> {

    // Check cache first
    const cacheKey = `${year ?? 'all'}:${scope}`;
    const cached = this.medalleroCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < this.cacheTtlMs) {
      return cached.data;
    }

    // Build event filter
    const eventWhere: {
      clubMedalsEnabled: boolean;
      technicalLevel: { in: TechnicalLevel[] };
      startDate?: { gte: Date; lt: Date };
    } = {
      clubMedalsEnabled: true,
      technicalLevel: {
        in: ['WA_STANDARD', 'INDOOR_STANDARD'],
      },
    };

    // Filter by year if provided
    if (year) {
      eventWhere.startDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    // Only national scope (exclude INTERNATIONAL_NATIONAL_TEAM)
    const scopeFilter = scope === 'national' 
      ? { eventScope: { in: ['NATIONAL_FEDERATION' as const, 'NATIONAL_INTERNATIONALIZED' as const] } }
      : {};

    // Get all qualifying events
    const events = await prisma.event.findMany({
      where: { ...eventWhere, ...scopeFilter },
      select: { id: true },
    });

    const eventIds = events.map((e) => e.id);

    if (eventIds.length === 0) {
      return [];
    }

    // Get event categories for these events (include all bow types — we'll weight barebow)
    const eventCategories = await prisma.eventCategory.findMany({
      where: { eventId: { in: eventIds } },
      select: { id: true },
    });

    const eventCategoryIds = eventCategories.map((ec) => ec.id);

    // Get FINAL, BRONZE_MATCH and QUALIFICATION phases
    const medalPhases = await prisma.phase.findMany({
      where: { name: { in: ['FINAL', 'BRONZE_MATCH', 'QUALIFICATION'] } },
    });

    const medalPhaseIds = medalPhases.map((p) => p.id);

    // Get all results that can produce medals
    // FINAL: positions 1, 2
    // BRONZE_MATCH: position 1
    // QUALIFICATION: positions 1, 2, 3
    
    // We need to fetch all possible results and then filter by phase rules
    const allResults = await prisma.result.findMany({
      where: {
        eventCategoryId: { in: eventCategoryIds },
        phaseId: { in: medalPhaseIds },
        position: { in: [1, 2, 3] }, // Broad filter, will refine below
        athlete: {
          clubId: { not: null }, // Exclude independientes
        },
      },
      include: {
        phase: true,
        athlete: {
          include: {
            club: true,
            // clubHistory is a JSON column on athlete and will be available in the returned object
          },
        },
        eventCategory: {
          // select explicitly so we include the distance field on the eventCategory
          select: {
            id: true,
            distance: true,
            category: true,
            event: {
              select: { id: true, name: true, eventScope: true, technicalLevel: true, startDate: true },
            },
          },
        },
      },
    });

    // Filter results based on phase-specific medal rules
    const results = allResults.filter((result) => {
      const phaseName = result.phase.name as PhaseName;
      const position = result.position;

      if (phaseName === 'QUALIFICATION') {
        // QUALIFICATION: positions 1, 2, 3 get medals
        return position <= 3;
      } else if (phaseName === 'FINAL') {
        // FINAL: only positions 1, 2 get medals
        return position <= 2;
      } else if (phaseName === 'BRONZE_MATCH') {
        // BRONZE_MATCH: only position 1 gets medal (the bronze)
        return position === 1;
      }
      return false;
    });

    // Calculate medals per club
    const clubMedals = new Map<number, ClubMedalCount>();

    for (const result of results) {
      const medal = deriveMedal(result.phase.name as PhaseName, result.position);

      if (!medal) continue;

      // Determine which club should receive this medal.
      // Prefer to use athlete.clubHistory (JSON) to determine the club at the time of the event.
      // Fallback to athlete.club (current club) if no matching history entry.
      const athlete: any = result.athlete;
      const athleteClub = athlete?.club || null;

      // event date - prefer event.startDate (from included event) otherwise use result.createdAt
      const evtIncluded: any = (result as any).eventCategory?.event;
      const eventDate = evtIncluded?.startDate ? new Date(evtIncluded.startDate) : new Date(result.createdAt);

  let clubId: number | null = athleteClub?.id ?? null;
  let historyFound: any = null;

      try {
        const history: any[] = athlete?.clubHistory ?? [];
        if (Array.isArray(history) && history.length > 0) {
          // history entries expected like { clubId, clubName, from, to }
          const found = history.find((h) => {
            const from = h.from ? new Date(h.from) : null;
            const to = h.to ? new Date(h.to) : null;
            if (from && to) return eventDate >= from && eventDate <= to;
            if (from && !to) return eventDate >= from;
            return false;
          });
          if (found && (found.clubId || found.clubName)) {
            clubId = Number(found.clubId);
            if (!clubId && found.clubName) {
              // try to resolve club by name (case-insensitive)
              const clubRec = await prisma.club.findFirst({ where: { name: { equals: found.clubName, mode: 'insensitive' } }, select: { id: true } });
              if (clubRec) {
                clubId = clubRec.id;
              }
            }
             historyFound = found;
           }
        }
      } catch (e) {
        // ignore parsing errors and fallback to current club
      }

      if (!clubId) continue; // still no club to attribute

      const clubKey = Number(clubId);
      if (!clubMedals.has(clubKey)) {
        const inferredName = historyFound?.clubName ?? athleteClub?.name ?? `Club ${clubKey}`;
        const inferredLogo = athleteClub?.logoUrl ?? null;
        const inferredHasLogo = athleteClub?.logoMimeType != null;
        clubMedals.set(clubKey, {
          clubId: clubKey,
          clubName: inferredName,
          logoUrl: inferredLogo,
          hasLogo: inferredHasLogo,
          gold: 0,
          silver: 0,
          bronze: 0,
          total: 0,
          points: 0,
          contributions: [],
        });
      }

      const club = clubMedals.get(clubKey)!;

      switch (medal) {
        case 'GOLD':
          club.gold++;
          break;
        case 'SILVER':
          club.silver++;
          break;
        case 'BRONZE':
          club.bronze++;
          break;
      }

        // record contribution detail for diagnostics / UI
        try {
          const contribution = {
            eventId: evtIncluded?.id,
            eventName: (evtIncluded as any)?.name,
            eventDate: evtIncluded?.startDate ? new Date(evtIncluded.startDate).toISOString() : undefined,
            athleteId: athlete.id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            medal: medal as 'GOLD' | 'SILVER' | 'BRONZE',
            phaseName: result.phase?.name,
          };
          club.contributions = club.contributions || [];
          club.contributions.push(contribution as any);
        } catch (e) {
          // ignore contribution recording errors
        }

      club.total++;

      // Calculate weighted points taking into account event scope, technical level, category bow type and distance
      const evt = evtIncluded;
      const cat = (result as any).eventCategory?.category;
      const scope = evt?.eventScope ?? 'NATIONAL_FEDERATION';
      const level = evt?.technicalLevel ?? 'WA_STANDARD';
      // Prefer the distance defined on EventCategory, fallback to event.distance if present
      const distance = (result as any).eventCategory?.distance ?? evt?.distance ?? null;
      const bowType = cat?.bowType ?? null;

      club.points += calculateWeightedPoints(medal, scope, level, distance, bowType);
    }

  // Convert to array and sort
  const result = Array.from(clubMedals.values());

    // Sort by: gold desc, silver desc, bronze desc, points desc
    result.sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return b.points - a.points;
    });

    // Round club points to nearest integer for presentation
    for (const r of result) {
      // ensure points is a finite number before rounding
      if (typeof r.points === 'number' && isFinite(r.points)) {
        r.points = Math.round(r.points);
      } else {
        r.points = 0;
      }
    }

    // store in cache
    try {
      this.medalleroCache.set(cacheKey, { ts: Date.now(), data: result });
    } catch (e) {
      // ignore cache set errors
    }

    return result;
  }

  /**
   * Get all years that have events with results
   */
  async getAvailableYears(): Promise<number[]> {
    const events = await prisma.event.findMany({
      where: {
        clubMedalsEnabled: true,
      },
      select: { startDate: true },
    });

    // Extract unique years from events
    const years = new Set<number>();
    for (const event of events) {
      years.add(new Date(event.startDate).getFullYear());
    }

    // Return sorted in descending order (newest first)
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Get top athletes per bowType+gender by medal points (all-time historical)
   * NOTE: Unlike getClubMedallero, this includes ALL events (no clubMedalsEnabled filter)
   */
  async getAthleteRanking(filters: MedalFilters): Promise<AthleteRankEntry[]> {
    const { year } = filters;

    // Get all events (no clubMedalsEnabled filter for athletes — include everything)
    const eventWhere: any = {
      technicalLevel: { in: ['WA_STANDARD', 'INDOOR_STANDARD'] },
    };
    if (year) {
      eventWhere.startDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    const events = await prisma.event.findMany({
      where: eventWhere,
      select: { id: true },
    });
    const eventIds = events.map((e) => e.id);
    if (eventIds.length === 0) return [];

    const eventCategories = await prisma.eventCategory.findMany({
      where: { eventId: { in: eventIds } },
      select: { id: true, category: true, distance: true, event: { select: { id: true, eventScope: true, technicalLevel: true, startDate: true } } },
    });
    const eventCategoryIds = eventCategories.map((ec) => ec.id);
    const ecMap = new Map(eventCategories.map((ec) => [ec.id, ec]));

    const medalPhases = await prisma.phase.findMany({
      where: { name: { in: ['FINAL', 'BRONZE_MATCH', 'QUALIFICATION'] } },
    });
    const medalPhaseIds = medalPhases.map((p) => p.id);

    const allResults = await prisma.result.findMany({
      where: {
        eventCategoryId: { in: eventCategoryIds },
        phaseId: { in: medalPhaseIds },
        position: { in: [1, 2, 3] },
      },
      include: {
        phase: true,
        athlete: { select: { id: true, firstName: true, lastName: true, bowType: true, gender: true, clubId: true, club: { select: { name: true } }, photoMimeType: true } },
      },
    });

    const results = allResults.filter((r) => {
      const ph = r.phase.name as PhaseName;
      if (ph === 'QUALIFICATION') return r.position <= 3;
      if (ph === 'FINAL') return r.position <= 2;
      if (ph === 'BRONZE_MATCH') return r.position === 1;
      return false;
    });

    const athleteMap = new Map<number, AthleteRankEntry>();

    for (const result of results) {
      const medal = deriveMedal(result.phase.name as PhaseName, result.position);
      if (!medal) continue;
      const ath = result.athlete;
      if (!ath) continue;

      const ec = ecMap.get(result.eventCategoryId);
      const pts = calculateWeightedPoints(
        medal as Medal,
        ec?.event?.eventScope ?? 'NATIONAL_FEDERATION',
        ec?.event?.technicalLevel ?? 'WA_STANDARD',
        (ec?.distance ?? null) as any,
        (ec?.category as any)?.bowType ?? undefined,
      );

      if (!athleteMap.has(ath.id)) {
        // Convert gender from 'M'/'F' to 'MALE'/'FEMALE' for frontend compatibility
        const genderEnum = (ath.gender as string) ?? null;
        const genderDisplay = genderEnum === 'M' ? 'MALE' : genderEnum === 'F' ? 'FEMALE' : genderEnum;
        
        athleteMap.set(ath.id, {
          athleteId: ath.id,
          firstName: ath.firstName,
          lastName: ath.lastName,
          bowType: (ath.bowType as string) ?? null,
          gender: genderDisplay,
          clubName: ath.club?.name ?? null,
          hasPhoto: ath.photoMimeType != null,
          gold: 0, silver: 0, bronze: 0, total: 0, points: 0,
        });
      }
      const entry = athleteMap.get(ath.id)!;
      if (medal === 'GOLD') entry.gold++;
      else if (medal === 'SILVER') entry.silver++;
      else if (medal === 'BRONZE') entry.bronze++;
      entry.total++;
      entry.points += pts;
    }

    return Array.from(athleteMap.values()).sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver);
  }
}

export const medalService = new MedalService();
