import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import prisma from '../services/prisma';

const router = Router();

/**
 * GET /api/modalities
 * Get all modalities
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const modalities = await prisma.modality.findMany({
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, modalities);
  })
);

export default router;
