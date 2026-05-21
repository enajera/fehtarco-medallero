import { Request, Response } from 'express';
import { athleteService } from '../services';
import { CreateAthleteInput, UpdateAthleteInput } from '../validation/schemas';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { asyncHandler } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { uploadAthletePhoto, getAthletePhoto } from '../services/storage.service';

// ============================================
// ATHLETE CONTROLLER
// ============================================

/**
 * GET /api/athletes
 * Get all athletes with filters and pagination
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as {
    clubId?: number;
    q?: string;
    active?: boolean;
    bowType?: 'RECURVE' | 'COMPOUND' | 'BAREBOW';
    gender?: 'M' | 'F';
    page?: number;
    limit?: number;
  };
  
  const { athletes, total, page, limit } = await athleteService.findAll(filters);
  sendPaginated(res, athletes, total, page, limit);
});

/**
 * GET /api/athletes/:id
 * Get athlete by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const athlete = await athleteService.findById(id);
  sendSuccess(res, athlete);
});

/**
 * POST /api/athletes
 * Create a new athlete
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateAthleteInput = req.body;
  const athlete = await athleteService.create(input);
  sendCreated(res, athlete);
});

/**
 * PUT /api/athletes/:id
 * Update an athlete
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const input: UpdateAthleteInput = req.body;
  const athlete = await athleteService.update(id, input);
  sendSuccess(res, athlete);
});

/**
 * DELETE /api/athletes/:id
 * Delete an athlete
 */
export const deleteAthlete = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const athlete = await athleteService.delete(id);
  sendSuccess(res, athlete);
});

/**
 * POST /api/athletes/:id/photo
 * Upload photo for athlete (requires auth and athlete.userId matches req.user.userId OR admin)
 */
export const uploadPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  const athleteId = parseInt(req.params.id);
  const file = req.file;

  if (!file) {
    throw new BadRequestError('No file provided');
  }

  // Validate file size (max 5MB for BYTEA storage)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new BadRequestError('File too large. Maximum 5MB allowed.');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestError('Invalid file type. Only JPEG, PNG, and WebP allowed.');
  }

  // Get athlete
  const athlete = await athleteService.findById(athleteId);

  // Authorization: check if user owns this athlete OR is admin/super_admin
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && athlete.userId !== req.user!.userId) {
    throw new ForbiddenError('You can only upload a photo for your own profile');
  }

  // Upload to PostgreSQL (BYTEA storage)
  const updated = await uploadAthletePhoto(athleteId, file.buffer, file.mimetype);

  // Return photoUrl that points to the GET /api/athletes/:id/photo endpoint
  const photoUrl = `/api/athletes/${athleteId}/photo`;

  sendSuccess(res, { photoUrl, athlete: updated });
});

/**
 * DELETE /api/athletes/:id/photo
 * Remove stored photo for an athlete
 */
export const deletePhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  const athleteId = parseInt(req.params.id);

  const athlete = await athleteService.findById(athleteId);

  // Authorization: admin or owner
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && athlete.userId !== req.user!.userId) {
    throw new ForbiddenError('You can only delete the photo of your own profile');
  }

  const updated = await athleteService.deletePhoto(athleteId);
  sendSuccess(res, { athlete: updated });
});
export const getPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
  const athleteId = parseInt(req.params.id);

  // Get photo from database
  const photoData = await getAthletePhoto(athleteId);

  if (!photoData) {
    throw new NotFoundError('No photo found for this athlete');
  }

  // Set response headers for image
  res.setHeader('Content-Type', photoData.photoMimeType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Send the photo buffer
  res.send(photoData.photoData);
});


