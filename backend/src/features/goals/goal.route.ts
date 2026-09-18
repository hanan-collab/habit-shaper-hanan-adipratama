import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createGoalController } from './goal.controller.js';
import type { GoalService } from './goal.service.js';

export function createGoalRoute(authService: AuthService, goalService: GoalService) {
  const router = Router();
  const controller = createGoalController(goalService);
  const authenticated = requireAuth(authService);
  router.get('/goals', authenticated, controller.list);
  router.post('/habits/:habitId/goals', authenticated, controller.create);
  router.patch('/goals/:goalId', authenticated, controller.update);
  router.delete('/goals/:goalId', authenticated, controller.delete);
  router.post('/goals/:goalId/cancel', authenticated, controller.cancel);
  return router;
}
