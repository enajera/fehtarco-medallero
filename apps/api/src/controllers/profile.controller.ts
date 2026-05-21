import { Request, Response } from 'express';
import { profileService } from '../services';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// PROFILE CONTROLLER
// ============================================

/**
 * GET /api/profile/athlete/:id
 * Get athlete profile with history
 */
export const getAthleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getAthleteProfile(id);
  sendSuccess(res, profile);
});

/**
 * GET /api/profile/club/:id
 * Get club profile with athletes and history
 */
export const getClubProfile = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const profile = await profileService.getClubProfile(id);
  sendSuccess(res, profile);
});
