import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createDashboardController } from './dashboard.controller.js';
import type { DashboardService } from './dashboard.service.js';

export function createDashboardRoute(authService: AuthService, dashboardService: DashboardService) {
  const router = Router();
  const controller = createDashboardController(dashboardService);
  router.get('/', requireAuth(authService), controller.get);
  return router;
}
