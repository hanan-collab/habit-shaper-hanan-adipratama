import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { createTrackingController } from './tracking.controller.js';
import type { TrackingService } from './tracking.service.js';

export function createTrackingRoute(authService: AuthService, service: TrackingService) {
  const router = Router();
  const controller = createTrackingController(service);
  router.use(requireAuth(authService));
  router.put('/:habitId/completions/:date', controller.putCompletion);
  router.delete('/:habitId/completions/:date', controller.deleteCompletion);
  router.put('/:habitId/relapses/:date', controller.putRelapse);
  router.delete('/:habitId/relapses/:date', controller.deleteRelapse);
  return router;
}
