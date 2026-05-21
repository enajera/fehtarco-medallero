import { Request, Response } from 'express';
import { categoryService } from '../services';
import { CreateCategoryInput } from '../validation/schemas';
import { UpdateCategoryInput } from '../validation/schemas';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// CATEGORY CONTROLLER
// ============================================

/**
 * GET /api/categories
 * Get all categories
 */
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.findAll();
  sendSuccess(res, categories);
});

/**
 * POST /api/categories
 * Create a new category
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateCategoryInput = req.body;
  const category = await categoryService.create(input);
  sendCreated(res, category);
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const input: UpdateCategoryInput = req.body;
  const updated = await categoryService.update(id, input as any);
  sendSuccess(res, updated);
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await categoryService.remove(id);
  sendSuccess(res, deleted);
});
