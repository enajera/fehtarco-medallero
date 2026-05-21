import { Router } from 'express';
import { importFromIanseo, importMatchesFromIanseo } from '../controllers/import.controller';

const router = Router();

// GET /api/import/ianseo?url=...
router.get('/ianseo', importFromIanseo);

// GET /api/import/ianseo-matches?url=...
router.get('/ianseo-matches', importMatchesFromIanseo);

export default router;
