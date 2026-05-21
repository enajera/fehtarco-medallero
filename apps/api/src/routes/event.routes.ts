import { Router } from 'express';
import { eventController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import { createEventSchema, updateEventSchema, createEventCategorySchema, eventQuerySchema } from '../validation/schemas';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/events
router.get('/', validateQuery(eventQuerySchema), eventController.getAll);

// GET /api/events/:id
router.get('/:id', eventController.getById);

// POST /api/events (ADMIN+)
router.post('/', requireAuth, requireAdmin, validateBody(createEventSchema), eventController.create);

// PUT /api/events/:id (ADMIN+)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateEventSchema), eventController.update);

// GET /api/events/:id/event-categories
router.get('/:id/event-categories', eventController.getEventCategories);

// POST /api/events/:id/event-categories (ADMIN+)
router.post('/:id/event-categories', requireAuth, requireAdmin, validateBody(createEventCategorySchema), eventController.addEventCategory);

export default router;
