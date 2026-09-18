import { Router } from 'express';
import { createHealthController } from './health.controller.js';
import type { HealthService } from './health.service.js';

export function createHealthRoute(service: HealthService) {
  const router = Router();
  const controller = createHealthController(service);
  router.get('/', controller.get);
  return router;
}
