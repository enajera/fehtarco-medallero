import { Router } from 'express';
import { authController } from '../controllers';
import { validateBody } from '../middleware';
import { loginSchema, registerAthleteSchema } from '../validation/schemas';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), authController.login);

// POST /api/auth/register-athlete
router.post('/register-athlete', validateBody(registerAthleteSchema), authController.registerAthlete);

// GET /api/auth/me
router.get('/me', requireAuth, authController.me);

export default router;
