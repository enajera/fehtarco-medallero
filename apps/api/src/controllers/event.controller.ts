import { Request, Response } from 'express';
import { eventService } from '../services';
import { CreateEventInput, UpdateEventInput, CreateEventCategoryInput, UpdateEventCategoryInput } from '../validation/schemas';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import { asyncHandler } from '../utils/errors';

// ============================================
// EVENT CONTROLLER
// ============================================

/**
 * GET /api/events
 * Get all events with filters and pagination
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as {
    year?: number;
    scope?: 'NATIONAL_FEDERATION' | 'NATIONAL_INTERNATIONALIZED' | 'INTERNATIONAL_NATIONAL_TEAM';
    technicalLevel?: 'WA_STANDARD' | 'INDOOR_STANDARD' | 'REDUCED' | 'DEVELOPMENT';
    page?: number;
    limit?: number;
  };
  
  const { events, total, page, limit } = await eventService.findAll(filters);
  sendPaginated(res, events, total, page, limit);
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const event = await eventService.findById(id);
  sendSuccess(res, event);
});

/**
 * POST /api/events
 * Create a new event
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateEventInput = req.body;
  const event = await eventService.create(input);
  sendCreated(res, event);
});

/**
 * PUT /api/events/:id
 * Update an event
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const input: UpdateEventInput = req.body;
  const event = await eventService.update(id, input);
  sendSuccess(res, event);
});

// ============================================
// EVENT CATEGORY CONTROLLER
// ============================================

/**
 * GET /api/events/:id/event-categories
 * Get event categories for an event
 */
export const getEventCategories = asyncHandler(async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.id);
  const eventCategories = await eventService.getEventCategories(eventId);
  sendSuccess(res, eventCategories);
});

/**
 * POST /api/events/:id/event-categories
 * Add a category to an event
 */
export const addEventCategory = asyncHandler(async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.id);
  const input: CreateEventCategoryInput = req.body;
  console.log('[addEventCategory] Input recibido:', input);
  const eventCategory = await eventService.addEventCategory(eventId, input);
  console.log('[addEventCategory] Guardado:', eventCategory);
  sendCreated(res, eventCategory);
});

/**
 * PUT /api/event-categories/:id
 * Update an event-category (change category/modality/distance/phases)
 */
export const updateEventCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const input: UpdateEventCategoryInput = req.body;
  console.log('[updateEventCategory] Input recibido:', input);
  const updated = await eventService.updateEventCategory(id, input);
  console.log('[updateEventCategory] Actualizado:', updated);
  sendSuccess(res, updated);
});

/**
 * DELETE /api/event-categories/:id
 * Remove a category from an event
 */
export const removeEventCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await eventService.removeEventCategory(id);
  sendNoContent(res);
});
