import { Router } from 'express';
import { diagnosticController } from '../controllers/diagnostic.controller';

const router = Router();

// GET /api/diagnostic/medals
router.get('/medals', diagnosticController.medalDiagnostic);

export default router;
