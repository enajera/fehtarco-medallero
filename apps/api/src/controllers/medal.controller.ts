import { Request, Response } from 'express';
import { medalService } from '../services';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// MEDAL CONTROLLER
// ============================================

/**
 * GET /api/medals/clubs
 * Get club medallero (national ranking)
 * If no data for the year, falls back to previous year
 */
export const getClubMedallero = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as {
    year?: number;
    scope?: 'national' | 'all';
  };
  
  const medallero = await medalService.getClubMedallero(filters);
  sendSuccess(res, medallero);
});

/**
 * GET /api/medals/years
 * Get all years that have medal data
 */
export const getAvailableYears = asyncHandler(async (req: Request, res: Response) => {
  const years = await medalService.getAvailableYears();
  sendSuccess(res, years);
});

/**
 * GET /api/medals/clubs/:id
 * Get details of a specific club in the medallero
 */
export const getClubDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const year = req.query.year ? Number(req.query.year) : undefined;
  const scope = req.query.scope as 'national' | 'all' | undefined;

  const medallero = await medalService.getClubMedallero({ year, scope });
  const club = medallero.find((c: any) => c.clubId === id);

  if (!club) {
    return sendSuccess(res, { found: false });
  }

  sendSuccess(res, club);
});

/**
 * GET /api/medals/athletes
 * Get athlete ranking by medal points, per bowType+gender
 */
export const getAthleteRanking = asyncHandler(async (req: Request, res: Response) => {
  const year  = req.query.year  ? Number(req.query.year)  : undefined;
  const scope = req.query.scope as 'national' | 'all' | undefined;
  const ranking = await medalService.getAthleteRanking({ year, scope });
  sendSuccess(res, ranking);
});

