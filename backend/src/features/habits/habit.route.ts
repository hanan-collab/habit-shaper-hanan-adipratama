import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createHabitController } from './habit.controller.js';
import type { HabitService } from './habit.service.js';

export function createHabitRoute(authService: AuthService, habitService: HabitService) {
  const router = Router();
  const controller = createHabitController(habitService);
  router.use(requireAuth(authService));
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:habitId', controller.get);
  router.patch('/:habitId', controller.update);
  router.delete('/:habitId', controller.delete);
  return router;
}
