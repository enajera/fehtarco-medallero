import prisma from './prisma';

const DISTANCE_ORDER = [
  'SEVENTY_METERS',
  'FIFTY_METERS',
  'THIRTY_METERS',
  'INDOOR',
  'TEN_METERS',
  'FIVE_METERS',
];

export interface RankingEntry {
  rank: number;
  athleteId: number;
  firstName: string;
  lastName: string;
  hasPhoto: boolean;
  club: { id: number; name: string } | null;
  gender: string;        // 'M' or 'F'
  topDistance: string;   // longest distance competed at
  avgScore: number;
  bestScore: number;
  totalCompetitions: number;  // number of QUALIFICATION results at topDistance
}

export class RankingService {
  async getByBowType(bowType: string): Promise<{ M: RankingEntry[]; F: RankingEntry[] }> {
    // Fetch all QUALIFICATION results for this bowType with distance
    const results = await prisma.result.findMany({
      where: {
        score: { gte: 30 },
        phase: { name: 'QUALIFICATION' },
        eventCategory: {
          category: { bowType },
          distance: { not: null },
        },
      },
      select: {
        score: true,
        athleteId: true,
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoMimeType: true,
            club: { select: { id: true, name: true } },
          },
        },
        eventCategory: {
          select: {
            distance: true,
            category: { select: { gender: true } },
          },
        },
      },
    });

    // Group by athleteId → distanceKey → scores[]
    const map = new Map<number, {
      athlete: any;
      gender: string;
      byDistance: Map<string, number[]>;
    }>();

    for (const r of results) {
      const dist = r.eventCategory.distance!;
      const rawGender = r.eventCategory.category.gender;
      // Normalize gender to M/F
      const gender = rawGender === 'MALE' ? 'M' : rawGender === 'FEMALE' ? 'F' : rawGender;

      if (!map.has(r.athleteId)) {
        map.set(r.athleteId, { athlete: r.athlete, gender, byDistance: new Map() });
      }
      const entry = map.get(r.athleteId)!;
      if (!entry.byDistance.has(dist)) entry.byDistance.set(dist, []);
      entry.byDistance.get(dist)!.push(r.score);
    }

    // Build ranking entries
    const entries: RankingEntry[] = [];
    for (const [, { athlete, gender, byDistance }] of map) {
      // Find longest distance this athlete has competed at
      let topDistance: string | null = null;
      for (const d of DISTANCE_ORDER) {
        if (byDistance.has(d)) { topDistance = d; break; }
      }
      if (!topDistance) continue;

      const scores = byDistance.get(topDistance)!;
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const bestScore = Math.max(...scores);

      entries.push({
        rank: 0,
        athleteId: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        hasPhoto: athlete.photoMimeType != null,
        club: athlete.club ?? null,
        gender,
        topDistance,
        avgScore,
        bestScore,
        totalCompetitions: scores.length,
      });
    }

    // Split by gender, sort each by avgScore desc, assign ranks
    const sort = (arr: RankingEntry[]) =>
      arr.sort((a, b) => b.avgScore - a.avgScore).map((e, i) => ({ ...e, rank: i + 1 }));

    return {
      M: sort(entries.filter(e => e.gender === 'M')),
      F: sort(entries.filter(e => e.gender === 'F')),
    };
  }
}

export const rankingService = new RankingService();
