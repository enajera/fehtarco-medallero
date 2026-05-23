import prisma from './prisma';
import { NotFoundError } from '../utils/errors';
import { deriveMedal, Medal } from '../utils/medals';
import { PhaseName } from '@prisma/client';

// ============================================
// PROFILE SERVICE (Athlete and Club profiles with history)
// ============================================

interface AthleteEventResult {
  eventId: number;
  eventName: string;
  eventDate: Date;
  categoryName: string;
  phase: PhaseName;
  position: number;
  score: number;
  medal: Medal;
}

interface AthleteProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string | null;
  bowType: string;
  photoUrl: string | null;
  hasPhoto?: boolean;
  club: { id: number; name: string; logoUrl: string | null } | null;
  clubHistory: Array<{ clubId: number | null; clubName?: string; from?: string | null; to?: string | null }>;
  drawWeightLbs: number | null;
  drawLengthIn: number | null;
  stats: {
    totalEvents: number;
    totalGold: number;
    totalSilver: number;
    totalBronze: number;
  };
  history: AthleteEventResult[];
}

interface ClubAthleteInfo {
  id: number;
  firstName: string;
  lastName: string;
  bowType: string;
  photoUrl: string | null;
  hasPhoto?: boolean;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

interface ClubProfile {
  id: number;
  name: string;
  city: string | null;
  logoUrl: string | null;
  hasLogo?: boolean;
  stats: {
    totalAthletes: number;
    totalGold: number;
    totalSilver: number;
    totalBronze: number;
  };
  athletes: ClubAthleteInfo[];
  yearlyMedals: Array<{
    year: number;
    gold: number;
    silver: number;
    bronze: number;
  }>;
  contributions?: ClubContribution[];
}

interface ClubContribution {
  athleteId: number;
  athleteName: string;
  eventId: number;
  eventName: string;
  eventDate: Date;
  medal: Medal;
  phase: PhaseName;
}

export class ProfileService {
  /**
   * Get full athlete profile with history
   */
  async getAthleteProfile(athleteId: number): Promise<AthleteProfile> {
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
        results: {
          include: {
            phase: true,
            eventCategory: {
              include: {
                event: true,
                category: true,
                modality: true,
              },
            },
          },
          orderBy: {
            eventCategory: {
              event: {
                startDate: 'desc',
              },
            },
          },
        },
      },
    });

    if (!athlete) {
      throw new NotFoundError('Athlete');
    }

    // Calculate medals and build history
    let totalGold = 0;
    let totalSilver = 0;
    let totalBronze = 0;
    const eventIds = new Set<number>();

    const history: AthleteEventResult[] = athlete.results.map((result) => {
      const event = result.eventCategory.event;
      const category = result.eventCategory.category;
      const modality = result.eventCategory.modality;
      
      eventIds.add(event.id);
      
      const medal = deriveMedal(result.phase.name, result.position);
      
      if (medal === 'GOLD') totalGold++;
      else if (medal === 'SILVER') totalSilver++;
      else if (medal === 'BRONZE') totalBronze++;

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.startDate,
        categoryName: `${category.bowType} ${category.gender} ${category.division} - ${modality.name}`,
        phase: result.phase.name,
        position: result.position,
        score: result.score,
        medal,
      };
    });

    return {
      id: athlete.id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      birthDate: athlete.birthDate,
      gender: athlete.gender,
      bowType: athlete.bowType,
      photoUrl: athlete.photoUrl,
      hasPhoto: athlete.photoMimeType !== null && athlete.photoMimeType !== undefined,
      club: athlete.club,
      clubHistory: (athlete.clubHistory as any) || [],
      drawWeightLbs: athlete.drawWeightLbs,
      drawLengthIn: athlete.drawLengthIn,
      stats: {
        totalEvents: eventIds.size,
        totalGold,
        totalSilver,
        totalBronze,
      },
      history,
    };
  }

  /**
   * Get full club profile with athletes and history
   */
  async getClubProfile(clubId: number): Promise<ClubProfile> {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        athletes: {
          where: { active: true },
          include: {
            results: {
              include: {
                phase: true,
                eventCategory: {
                  include: {
                    event: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundError('Club');
    }

    // Calculate club totals and per-athlete medals
    let totalGold = 0;
    let totalSilver = 0;
    let totalBronze = 0;
    const yearlyMedals = new Map<number, { gold: number; silver: number; bronze: number }>();

    const athletes: ClubAthleteInfo[] = club.athletes.map((athlete) => {
      let athleteGold = 0;
      let athleteSilver = 0;
      let athleteBronze = 0;

      for (const result of athlete.results) {
        const medal = deriveMedal(result.phase.name, result.position);
        const year = result.eventCategory.event.startDate.getFullYear();

        if (!yearlyMedals.has(year)) {
          yearlyMedals.set(year, { gold: 0, silver: 0, bronze: 0 });
        }

        const yearData = yearlyMedals.get(year)!;

        if (medal === 'GOLD') {
          athleteGold++;
          totalGold++;
          yearData.gold++;
        } else if (medal === 'SILVER') {
          athleteSilver++;
          totalSilver++;
          yearData.silver++;
        } else if (medal === 'BRONZE') {
          athleteBronze++;
          totalBronze++;
          yearData.bronze++;
        }
      }

      return {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        bowType: athlete.bowType,
        photoUrl: athlete.photoUrl,
        hasPhoto: (athlete as any).photoMimeType !== null && (athlete as any).photoMimeType !== undefined,
        medals: {
          gold: athleteGold,
          silver: athleteSilver,
          bronze: athleteBronze,
        },
      };
    });

    // Sort athletes by total medals
    athletes.sort((a, b) => {
      const totalA = a.medals.gold + a.medals.silver + a.medals.bronze;
      const totalB = b.medals.gold + b.medals.silver + b.medals.bronze;
      return totalB - totalA;
    });

    // Convert yearly medals to sorted array
    const yearlyMedalsArray = Array.from(yearlyMedals.entries())
      .map(([year, medals]) => ({ year, ...medals }))
      .sort((a, b) => b.year - a.year);

    // -- New: compute contributions for this club based on athlete history at event time
    // Get medal phases
    const medalPhases = await prisma.phase.findMany({ where: { name: { in: ['FINAL', 'BRONZE_MATCH', 'QUALIFICATION'] } } });
    const medalPhaseIds = medalPhases.map((p) => p.id);
    
    // Fetch all candidate results (positions that may yield medals)
    const candidateResults = await prisma.result.findMany({
      where: {
        phaseId: { in: medalPhaseIds },
        position: { in: [1, 2, 3] },
      },
      include: {
        phase: true,
        athlete: {
          include: {
            club: true,
            // clubHistory stored as JSON; will be available in returned object
          },
        },
        eventCategory: {
          include: { event: true },
        },
      },
    });
    
    const contributions: ClubContribution[] = [];
    // Map athleteId -> medal counts for this club
    const perAthleteForClub = new Map<number, { gold: number; silver: number; bronze: number }>();
    
    for (const result of candidateResults) {
      const medal = deriveMedal(result.phase.name, result.position);
      if (!medal) continue;
    
      const athlete = result.athlete as any;
      const evt = result.eventCategory.event as any;
      const eventDate = evt.startDate ? new Date(evt.startDate) : new Date(result.createdAt);
    
      // Determine club at time of event using athlete.clubHistory if present, otherwise athlete.club
      let clubAtEvent: number | null = athlete?.club?.id ?? null;
      try {
        const history: any[] = athlete?.clubHistory ?? [];
        if (Array.isArray(history) && history.length > 0) {
          const found = history.find((h) => {
            const from = h.from ? new Date(h.from) : null;
            const to = h.to ? new Date(h.to) : null;
            if (from && to) return eventDate >= from && eventDate <= to;
            if (from && !to) return eventDate >= from;
            return false;
          });
          if (found) {
            if (found.clubId) clubAtEvent = Number(found.clubId);
            else if (found.clubName) {
              // try resolve by name
              const rec = await prisma.club.findFirst({ where: { name: { equals: found.clubName, mode: 'insensitive' } }, select: { id: true } });
              if (rec) clubAtEvent = rec.id;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    
      if (clubAtEvent === clubId) {
        // this result contributed to the club
        contributions.push({
          athleteId: athlete.id,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          eventId: evt.id,
          eventName: evt.name,
          eventDate,
          medal,
          phase: result.phase.name,
        });

        // increment per-athlete counters for this club
        const prev = perAthleteForClub.get(athlete.id) || { gold: 0, silver: 0, bronze: 0 };
        if (medal === 'GOLD') prev.gold++;
        else if (medal === 'SILVER') prev.silver++;
        else if (medal === 'BRONZE') prev.bronze++;
        perAthleteForClub.set(athlete.id, prev);

        // increment club totals
        if (medal === 'GOLD') totalGold++;
        else if (medal === 'SILVER') totalSilver++;
        else if (medal === 'BRONZE') totalBronze++;

        // increment yearly medall counts for the club
        const yr = eventDate.getFullYear();
        if (!yearlyMedals.has(yr)) {
          yearlyMedals.set(yr, { gold: 0, silver: 0, bronze: 0 });
        }
        const y = yearlyMedals.get(yr)!;
        if (medal === 'GOLD') y.gold++;
        else if (medal === 'SILVER') y.silver++;
        else if (medal === 'BRONZE') y.bronze++;
        yearlyMedals.set(yr, y);
      }
    }
    
    // Now adjust athletes array medals counts to only those contributions that belong to this club
    const athletesMap = new Map<number, ClubAthleteInfo>();
    for (const a of athletes) {
      athletesMap.set(a.id, a);
      const counts = perAthleteForClub.get(a.id);
      if (counts) {
        a.medals = { gold: counts.gold, silver: counts.silver, bronze: counts.bronze };
      } else {
        a.medals = { gold: 0, silver: 0, bronze: 0 };
      }
    }

    // Recompute totals and yearlyMedals from contributions to ensure consistency
    totalGold = 0;
    totalSilver = 0;
    totalBronze = 0;
    yearlyMedals.clear();

    for (const c of contributions) {
      if (c.medal === 'GOLD') totalGold++;
      else if (c.medal === 'SILVER') totalSilver++;
      else if (c.medal === 'BRONZE') totalBronze++;

      const yr = c.eventDate.getFullYear();
      if (!yearlyMedals.has(yr)) yearlyMedals.set(yr, { gold: 0, silver: 0, bronze: 0 });
      const y = yearlyMedals.get(yr)!;
      if (c.medal === 'GOLD') y.gold++;
      else if (c.medal === 'SILVER') y.silver++;
      else if (c.medal === 'BRONZE') y.bronze++;
      yearlyMedals.set(yr, y);
    }

    // Convert yearly medals Map to sorted array at the end (after contributions are counted)
    const yearlyMedalsArrayFinal = Array.from(yearlyMedals.entries())
      .map(([year, medals]) => ({ year, ...medals }))
      .sort((a, b) => b.year - a.year);

    // Return profile including contributions (sorted by event date desc)
    return {
      id: club.id,
      name: club.name,
      city: club.city,
      logoUrl: club.logoUrl,
      hasLogo: (club as any).logoMimeType !== null && (club as any).logoMimeType !== undefined,
      stats: {
        totalAthletes: club.athletes.length,
        totalGold,
        totalSilver,
        totalBronze,
      },
      athletes,
      yearlyMedals: yearlyMedalsArrayFinal,
      contributions: contributions.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime()),
    };
  }
}

export const profileService = new ProfileService();
