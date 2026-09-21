import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createStatisticsController } from './statistics.controller.js';
import type { StatisticsService } from './statistics.service.js';

export function createStatisticsRoute(authService: AuthService, statisticsService: StatisticsService) {
  const router = Router();
  const controller = createStatisticsController(statisticsService);
  const authenticated = requireAuth(authService);
  router.get('/statistics', authenticated, controller.all);
  router.get('/habits/:habitId/statistics', authenticated, controller.get);
  return router;
}
