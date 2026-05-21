import { Response } from 'express';
import { authService } from '../services';
import { AuthRequest } from '../middleware/auth';
import { LoginInput, RegisterAthleteInput } from '../validation/schemas';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// AUTH CONTROLLER
// ============================================

/**
 * POST /api/auth/login
 * Login and get JWT token
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input: LoginInput = req.body;
  const result = await authService.login(input);
  sendSuccess(res, result);
});

/**
 * POST /api/auth/register-athlete
 * Register as an athlete and create account
 */
export const registerAthlete = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input: RegisterAthleteInput = req.body;
  const result = await authService.registerAthlete(input);
  sendCreated(res, result);
});

/**
 * GET /api/auth/me
 * Get current user info
 */
export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getUserById(req.user!.userId);
  sendSuccess(res, user);
});

