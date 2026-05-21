import { Router } from 'express';
import { clubController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import { createClubSchema, updateClubSchema, clubQuerySchema } from '../validation/schemas';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { upload } from '../middleware/multer';

const router = Router();

// GET /api/clubs
router.get('/', validateQuery(clubQuerySchema), clubController.getAll);

// GET /api/clubs/:id
router.get('/:id', clubController.getById);

// GET /api/clubs/:id/logo  (public, no auth)
router.get('/:id/logo', clubController.getLogo);

// POST /api/clubs (ADMIN+)
router.post('/', requireAuth, requireAdmin, validateBody(createClubSchema), clubController.create);

// PUT /api/clubs/:id (ADMIN+)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateClubSchema), clubController.update);

// POST /api/clubs/:id/logo (ADMIN+)
router.post('/:id/logo', requireAuth, requireAdmin, upload.single('logo'), clubController.uploadLogo);

// DELETE /api/clubs/:id/logo (ADMIN+)
router.delete('/:id/logo', requireAuth, requireAdmin, clubController.deleteLogo);

// DELETE /api/clubs/:id (SUPER_ADMIN)
router.delete('/:id', requireAuth, requireSuperAdmin, clubController.remove);

export default router;
