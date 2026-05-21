import { Router } from 'express';
import {
  bulkImportClubs,
  bulkImportAthletes,
  bulkImportEvents,
  bulkImportEventCategories,
  bulkImportResults,
} from '../controllers/bulk.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/bulk/clubs
 * Import multiple clubs in bulk
 * @requires ADMIN or SUPER_ADMIN role
 */
router.post('/clubs', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), bulkImportClubs);

/**
 * POST /api/bulk/athletes
 * Import multiple athletes in bulk
 * @requires ADMIN or SUPER_ADMIN role
 */
router.post('/athletes', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), bulkImportAthletes);

/**
 * POST /api/bulk/events
 * Import multiple events in bulk
 * @requires ADMIN or SUPER_ADMIN role
 */
router.post('/events', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), bulkImportEvents);

/**
 * POST /api/bulk/event-categories
 * Import multiple event-category associations in bulk
 * @requires ADMIN or SUPER_ADMIN role
 */
router.post(
  '/event-categories',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  bulkImportEventCategories
);

/**
 * POST /api/bulk/results
 * Import multiple results in bulk
 * @requires ADMIN or SUPER_ADMIN role
 */
router.post('/results', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), bulkImportResults);

export default router;
