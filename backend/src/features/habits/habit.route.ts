import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createHabitController } from './habit.controller.js';
import type { HabitService } from './habit.service.js';
import type { CompositionService } from '../composition/composition.service.js';

export function createHabitRoute(
  authService: AuthService,
  habitService: HabitService,
  composition: CompositionService,
) {
  const router = Router();
  const controller = createHabitController(habitService, composition);
  router.use(requireAuth(authService));
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:habitId', controller.get);
  router.patch('/:habitId', controller.update);
  router.patch('/:habitId/goals', controller.updateGoals);
  router.delete('/:habitId', controller.delete);
  return router;
}
