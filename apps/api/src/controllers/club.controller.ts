import { Request, Response } from 'express';
import { clubService } from '../services';
import { CreateClubInput, UpdateClubInput, clubQuerySchema } from '../validation/schemas';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import { asyncHandler, BadRequestError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

// ============================================
// CLUB CONTROLLER
// ============================================

/**
 * GET /api/clubs
 * Get all clubs
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  // parse query params (we could rely on validateQuery but keep simple here)
  const q = (req.query.q as string) || undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const includeInactive = req.query.includeInactive === 'true';

  const { clubs, total, page: p, limit: l } = await clubService.findAll({ q, page, limit, includeInactive });
  sendPaginated(res, clubs, total, p, l);
});

/**
 * GET /api/clubs/:id
 * Get club by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const club = await clubService.findById(id);
  sendSuccess(res, club);
});

/**
 * POST /api/clubs
 * Create a new club
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateClubInput = req.body;
  const club = await clubService.create(input);
  sendCreated(res, club);
});

/**
 * PUT /api/clubs/:id
 * Update a club
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const input: UpdateClubInput = req.body;
  const club = await clubService.update(id, input);
  sendSuccess(res, club);
});

/**
 * DELETE /api/clubs/:id
 * Soft delete a club
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await clubService.delete(id);
  sendNoContent(res);
});

/**
 * POST /api/clubs/:id/logo
 * Upload club logo (multipart, field "logo", max 5MB, jpeg/png/webp)
 */
export const uploadLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const file = req.file;
  if (!file) throw new BadRequestError('No file provided');
  if (file.size > 5 * 1024 * 1024) throw new BadRequestError('File too large. Maximum 5MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
    throw new BadRequestError('Invalid file type. Only JPEG, PNG, and WebP allowed.');
  const updated = await clubService.uploadLogo(id, file.buffer, file.mimetype);
  sendSuccess(res, { logoUrl: `/api/clubs/${id}/logo`, club: updated });
});

/**
 * GET /api/clubs/:id/logo
 * Serve stored club logo (no auth required)
 */
export const getLogo = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const data = await clubService.getLogo(id);
  if (!data) throw new NotFoundError('Logo');
  res.setHeader('Content-Type', data.logoMimeType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(data.logoData);
});

/**
 * DELETE /api/clubs/:id/logo
 * Remove stored club logo
 */
export const deleteLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = await clubService.deleteLogo(id);
  sendSuccess(res, { club: updated });
});
