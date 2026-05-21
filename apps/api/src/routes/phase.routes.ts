import { Router } from 'express';
import * as phaseController from '../controllers/phase.controller';

const router = Router();

router.get('/', phaseController.getPhases);

export default router;