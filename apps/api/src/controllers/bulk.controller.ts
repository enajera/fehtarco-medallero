import { Request, Response, NextFunction } from 'express';
import {
  bulkClubsSchema,
  bulkAthletesSchema,
  bulkEventsSchema,
  bulkEventCategoriesSchema,
  bulkResultsSchema,
  BulkResponse,
} from '../validation/bulk.schemas';
import {
  bulkCreateClubs,
  bulkCreateAthletes,
  bulkCreateEvents,
  bulkCreateEventCategories,
  bulkCreateResults,
} from '../services/bulk.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler, BadRequestError } from '../utils/errors';

// ============================================
// BULK CLUBS
// ============================================

export const bulkImportClubs = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkClubsSchema.parse(req.body);
  const result = await bulkCreateClubs(validatedData);
  sendSuccess(res, result, 201);
});

// ============================================
// BULK ATHLETES
// ============================================

export const bulkImportAthletes = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkAthletesSchema.parse(req.body);
  const result = await bulkCreateAthletes(validatedData);
  sendSuccess(res, result, 201);
});

// ============================================
// BULK EVENTS
// ============================================

export const bulkImportEvents = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkEventsSchema.parse(req.body);
  const result = await bulkCreateEvents(validatedData);
  sendSuccess(res, result, 201);
});

// ============================================
// BULK EVENT CATEGORIES
// ============================================

export const bulkImportEventCategories = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkEventCategoriesSchema.parse(req.body);
  const result = await bulkCreateEventCategories(validatedData);
  sendSuccess(res, result, 201);
});

// ============================================
// BULK RESULTS
// ============================================

export const bulkImportResults = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkResultsSchema.parse(req.body);
  const result = await bulkCreateResults(validatedData);
  sendSuccess(res, result, 201);
});
