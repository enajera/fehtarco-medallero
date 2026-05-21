import { Router } from 'express';
import { categoryController } from '../controllers';
import { validateBody } from '../middleware';
import { createCategorySchema } from '../validation/schemas';
import { updateCategorySchema } from '../validation/schemas';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/categories
router.get('/', categoryController.getAll);

// POST /api/categories (ADMIN+)
router.post('/', requireAuth, requireAdmin, validateBody(createCategorySchema), categoryController.create);

// PUT /api/categories/:id (ADMIN+)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateCategorySchema), categoryController.update);

// DELETE /api/categories/:id (ADMIN+)
router.delete('/:id', requireAuth, requireAdmin, categoryController.remove);

export default router;
