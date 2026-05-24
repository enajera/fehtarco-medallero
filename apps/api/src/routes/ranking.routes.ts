import { Router } from 'express';
import { rankingController } from '../controllers/ranking.controller';

const router = Router();
router.get('/', rankingController.getByBowType);
export default router;
