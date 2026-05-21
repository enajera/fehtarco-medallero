import { Router } from 'express';
import { medalController } from '../controllers';
import { validateQuery } from '../middleware';
import { medalQuerySchema } from '../validation/schemas';

const router = Router();

// GET /api/medals/clubs
router.get('/clubs', validateQuery(medalQuerySchema), medalController.getClubMedallero);

// GET /api/medals/clubs/:id
router.get('/clubs/:id', medalController.getClubDetails);

// GET /api/medals/years
router.get('/years', medalController.getAvailableYears);

// GET /api/medals/athletes
router.get('/athletes', validateQuery(medalQuerySchema), medalController.getAthleteRanking);

export default router;
