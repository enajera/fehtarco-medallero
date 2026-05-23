import { Router } from 'express';
import authRoutes from './auth.routes';
import clubRoutes from './club.routes';
import athleteRoutes from './athlete.routes';
import categoryRoutes from './category.routes';
import modalityRoutes from './modality.routes';
import eventRoutes from './event.routes';
import eventCategoryRoutes from './eventCategory.routes';
import resultRoutes, { getResultsByEventRouter } from './result.routes';
import medalRoutes from './medal.routes';
import profileRoutes from './profile.routes';
import bulkRoutes from './bulk.routes';
import diagnosticRoutes from './diagnostic.routes';
import phaseRoutes from './phase.routes';
import importRoutes from './import.routes';
import recordsRoutes from './records.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/clubs', clubRoutes);
router.use('/athletes', athleteRoutes);
router.use('/categories', categoryRoutes);
router.use('/modalities', modalityRoutes);
router.use('/events', eventRoutes);
router.use('/event-categories', eventCategoryRoutes);
router.use('/results', resultRoutes);
router.use('/medals', medalRoutes);
router.use('/profile', profileRoutes);
router.use('/bulk', bulkRoutes);
router.use('/diagnostic', diagnosticRoutes);
router.use('/phases', phaseRoutes);
router.use('/import', importRoutes);
router.use('/records', recordsRoutes);

// Results by event (nested route)
router.use('/events/:eventId/results', getResultsByEventRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
