import { Router } from 'express';
import { eventController } from '../controllers';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware';
import { updateEventCategorySchema } from '../validation/schemas';

const router = Router();

// DELETE /api/event-categories/:id (ADMIN+)
router.delete('/:id', requireAuth, requireAdmin, eventController.removeEventCategory);

// PUT /api/event-categories/:id (ADMIN+) - update category metadata (modality/distance/category)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateEventCategorySchema), eventController.updateEventCategory);

export default router;
