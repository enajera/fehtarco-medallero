import { Request, Response } from 'express';
import prisma from '../services/prisma';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// DIAGNOSTIC CONTROLLER
// ============================================

/**
 * GET /api/diagnostic/medals
 * Check medal calculation prerequisites
 */
export const medalDiagnostic = asyncHandler(async (req: Request, res: Response) => {
  // 1. Check events with clubMedalsEnabled
  const eventsWithMedals = await prisma.event.count({
    where: { clubMedalsEnabled: true },
  });

  const eventsTotal = await prisma.event.count();

  // 2. Check events with correct technical level
  const eventsWithOfficialLevel = await prisma.event.count({
    where: {
      clubMedalsEnabled: true,
      technicalLevel: { in: ['WA_STANDARD', 'INDOOR_STANDARD'] },
    },
  });

  // 3. Check results in FINAL phase
  const resultsFinal = await prisma.result.count({
    where: {
      phase: {
        name: 'FINAL',
      },
    },
  });

  // 4. Check results in BRONZE_MATCH phase
  const resultsBronze = await prisma.result.count({
    where: {
      phase: {
        name: 'BRONZE_MATCH',
      },
    },
  });

  // 5. Check athletes with clubId
  const athletesWithClub = await prisma.athlete.count({
    where: { clubId: { not: null } },
  });

  const athletesTotal = await prisma.athlete.count();

  // 6. Check results from athletes with clubs in medal phases
  const medalEligibleResults = await prisma.result.count({
    where: {
      phase: {
        name: { in: ['FINAL', 'BRONZE_MATCH'] },
      },
      athlete: {
        clubId: { not: null },
      },
    },
  });

  // 7. Get phases available
  const phases = await prisma.phase.findMany({
    select: { id: true, name: true },
  });

  // 8. Get sample event with clubMedalsEnabled
  const sampleEvent = await prisma.event.findFirst({
    where: { clubMedalsEnabled: true },
    select: {
      id: true,
      name: true,
      clubMedalsEnabled: true,
      technicalLevel: true,
      startDate: true,
    },
  });

  // 9. Get sample results in medal phases
  const sampleResults = await prisma.result.findMany({
    where: {
      phase: {
        name: { in: ['FINAL', 'BRONZE_MATCH'] },
      },
    },
    take: 5,
    include: {
      phase: { select: { name: true } },
      athlete: { select: { id: true, firstName: true, lastName: true, clubId: true } },
    },
  });

  const diagnostic = {
    events: {
      total: eventsTotal,
      withMedalsEnabled: eventsWithMedals,
      withOfficialLevel: eventsWithOfficialLevel,
      percentage: eventsTotal > 0 ? ((eventsWithOfficialLevel / eventsTotal) * 100).toFixed(2) : '0',
    },
    athletes: {
      total: athletesTotal,
      withClub: athletesWithClub,
      independent: athletesTotal - athletesWithClub,
      percentage: athletesTotal > 0 ? ((athletesWithClub / athletesTotal) * 100).toFixed(2) : '0',
    },
    results: {
      inFinal: resultsFinal,
      inBronzeMatch: resultsBronze,
      totalMedalPhases: resultsFinal + resultsBronze,
      medalEligible: medalEligibleResults,
    },
    phases: phases.map(p => ({ id: p.id, name: p.name })),
    samples: {
      eventWithMedals: sampleEvent,
      resultsInMedalPhases: sampleResults.map(r => ({
        athleteId: r.athlete.id,
        athleteName: `${r.athlete.firstName} ${r.athlete.lastName}`,
        clubId: r.athlete.clubId,
        phase: r.phase.name,
        position: r.position,
      })),
    },
    verdict: {
      canCalculateMedals: eventsWithOfficialLevel > 0 && medalEligibleResults > 0,
      issues: [
        eventsWithOfficialLevel === 0 ? '❌ No events with clubMedalsEnabled=true and WA_STANDARD/INDOOR_STANDARD level' : '✅ Events configured correctly',
        athletesWithClub === 0 ? '❌ No athletes assigned to clubs' : '✅ Athletes assigned to clubs',
        medalEligibleResults === 0 ? '❌ No results in FINAL or BRONZE_MATCH phases' : `✅ ${medalEligibleResults} eligible results found`,
      ].filter(i => i.startsWith('❌')),
    },
  };

  sendSuccess(res, diagnostic);
});

export const diagnosticController = {
  medalDiagnostic,
};
