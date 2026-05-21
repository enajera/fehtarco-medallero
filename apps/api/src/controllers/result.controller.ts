import { Request, Response } from 'express';
import { resultService } from '../services';
import { CreateResultsInput, UpdateResultInput } from '../validation/schemas';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { asyncHandler } from '../utils/errors';
import { PhaseName } from '@prisma/client';

// ============================================
// RESULT CONTROLLER
// ============================================

/**
 * GET /api/events/:eventId/results
 * Get results for an event
 */
export const getByEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.eventId);
  const filters = req.query as {
    categoryId?: number;
    modalityId?: number;
    phase?: PhaseName;
    distance?: string;
    eventCategoryId?: number;
    page?: number;
    limit?: number;
  };
  
  const page = filters.page || 1;
  const limit = filters.limit || 200;
  const { results, total } = await resultService.findByEvent(eventId, filters, { page, limit });
  const totalPages = Math.ceil(total / limit);
  sendSuccess(res, results, 200, { total, page, limit, totalPages });
});

/**
 * GET /api/events/:eventId/results/summary
 * Lightweight summary endpoint that returns results grouped per event category (single optimized query)
 */
export const getSummaryByEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.eventId);
  const grouped = await resultService.findByEventSummary(eventId);
  // Derive unique phases from the grouped results so clients don't need a separate /api/phases call
  const phasesMap: Record<number, { id: number; name: string; orderIndex: number }> = {};
  for (const g of grouped) {
    for (const r of g.results || []) {
      if (r.phase && r.phase.id != null) {
        phasesMap[r.phase.id] = { id: r.phase.id, name: r.phase.name, orderIndex: r.phase.orderIndex };
      }
    }
  }
  const phases = Object.values(phasesMap).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  sendSuccess(res, { grouped, phases });
});

/**
 * POST /api/results
 * Create results (bulk)
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateResultsInput = req.body;
  const results = await resultService.createBulk(input.items);
  sendCreated(res, results);
});

/**
 * PUT /api/results/:id
 * Update a result
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const input: UpdateResultInput = req.body;
  const result = await resultService.update(id, input);
  sendSuccess(res, result);
});

/**
 * DELETE /api/results/:id
 * Delete a result
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await resultService.delete(id);
  sendNoContent(res);
});
