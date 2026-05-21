import { Router } from 'express';
import { resultController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import { createResultsSchema, updateResultSchema, resultQuerySchema } from '../validation/schemas';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// POST /api/results (ADMIN+) - Bulk create
router.post('/', requireAuth, requireAdmin, validateBody(createResultsSchema), resultController.create);

// PUT /api/results/:id (ADMIN+)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateResultSchema), resultController.update);

// DELETE /api/results/:id (ADMIN+)
router.delete('/:id', requireAuth, requireAdmin, resultController.remove);

export default router;

// Note: GET /api/events/:eventId/results is defined in event routes for cleaner API
export const getResultsByEventRouter = Router({ mergeParams: true });
getResultsByEventRouter.get('/', validateQuery(resultQuerySchema), resultController.getByEvent);
getResultsByEventRouter.get('/summary', resultController.getSummaryByEvent);
