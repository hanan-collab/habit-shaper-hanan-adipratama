import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createStatisticsController } from './statistics.controller.js';
import type { StatisticsService } from './statistics.service.js';

export function createStatisticsRoute(authService: AuthService, statisticsService: StatisticsService) {
  const router = Router();
  const controller = createStatisticsController(statisticsService);
  router.use(requireAuth(authService));
  router.get('/:habitId/statistics', controller.get);
  return router;
}
