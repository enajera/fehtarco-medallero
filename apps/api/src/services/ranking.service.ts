import { BowType } from '@prisma/client';
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
          category: { bowType: bowType as BowType },
          distance: { not: null },
        },
      },
      include: {
        athlete: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
        eventCategory: {
          include: {
            category: { select: { gender: true, bowType: true, division: true } },
          },
        },
      },
    });

    // Group by athleteId → distanceKey → scores[]
    const map = new Map<number, {
      athlete: typeof results[0]['athlete'];
      gender: string;
      byDistance: Map<string, number[]>;
    }>();

    for (const r of results) {
      const dist = r.eventCategory.distance!;
      const gender = r.eventCategory.category.gender as string; // enum Gender: 'M' | 'F'

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
        club: athlete.club ? { id: athlete.club.id, name: athlete.club.name } : null,
        gender,
        topDistance,
        avgScore,
        bestScore,
        totalCompetitions: scores.length,
      });
    }

    // Split by gender, sort each by: 1) longest distance first, 2) best score desc
    const distanceRank = Object.fromEntries(DISTANCE_ORDER.map((d, i) => [d, i]));
    const sort = (arr: RankingEntry[]) =>
      arr
        .sort((a, b) => {
          const dA = distanceRank[a.topDistance] ?? 99;
          const dB = distanceRank[b.topDistance] ?? 99;
          if (dA !== dB) return dA - dB; // lower index = longer distance = better rank
          return b.bestScore - a.bestScore; // same distance → higher best score wins
        })
        .map((e, i) => ({ ...e, rank: i + 1 }));

    return {
      M: sort(entries.filter(e => e.gender === 'M')),
      F: sort(entries.filter(e => e.gender === 'F')),
    };
  }
}

export const rankingService = new RankingService();
