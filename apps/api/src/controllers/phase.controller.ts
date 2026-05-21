import { Request, Response } from 'express';
import prisma from '../services/prisma';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/errors';

export const getPhases = asyncHandler(async (_req: Request, res: Response) => {
  const phases = await prisma.phase.findMany({ orderBy: { orderIndex: 'asc' } });
  sendSuccess(res, phases.map(p => ({ id: p.id, name: p.name, order: p.orderIndex })));
});
