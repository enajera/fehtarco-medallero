import { Router } from 'express';
import { profileController } from '../controllers';

const router = Router();

// GET /api/profile/athlete/:id
router.get('/athlete/:id', profileController.getAthleteProfile);

// GET /api/profile/club/:id
router.get('/club/:id', profileController.getClubProfile);

export default router;
