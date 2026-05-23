import { Request, Response } from 'express';
import { recordsService } from '../services/records.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/errors';

/**
 * GET /api/records
 * Returns best scores per category from official events.
 * Query: bowType?, gender?, phase?
 */
export const getRecords = asyncHandler(async (req: Request, res: Response) => {
  const { bowType, gender, phase } = req.query as Record<string, string>;
  const records = await recordsService.getRecords({ bowType, gender, phase });
  sendSuccess(res, records);
});
