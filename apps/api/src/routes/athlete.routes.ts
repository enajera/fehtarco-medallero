import { Router } from 'express';
import { athleteController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import { createAthleteSchema, updateAthleteSchema, athleteQuerySchema, selfUpdateAthleteSchema } from '../validation/schemas';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/multer';

const router = Router();

// GET /api/athletes
router.get('/', validateQuery(athleteQuerySchema), athleteController.getAll);

// GET /api/athletes/:id
router.get('/:id', athleteController.getById);

// GET /api/athletes/:id/photo
router.get('/:id/photo', athleteController.getPhoto);

// POST /api/athletes (ADMIN+)
router.post('/', requireAuth, requireAdmin, validateBody(createAthleteSchema), athleteController.create);

// PUT /api/athletes/:id (ADMIN+)
router.put('/:id', requireAuth, requireAdmin, validateBody(updateAthleteSchema), athleteController.update);

// DELETE /api/athletes/:id (ADMIN+)
router.delete('/:id', requireAuth, requireAdmin, athleteController.deleteAthlete);

// PUT /api/athletes/:id/self (AUTH | only own profile)
router.put('/:id/self', requireAuth, validateBody(selfUpdateAthleteSchema), athleteController.selfUpdate);

// POST /api/athletes/:id/photo (AUTH+ | athlete or admin)
router.post('/:id/photo', requireAuth, upload.single('photo'), athleteController.uploadPhoto);

// DELETE /api/athletes/:id/photo (AUTH+ | athlete or admin)
router.delete('/:id/photo', requireAuth, athleteController.deletePhoto);

export default router;
