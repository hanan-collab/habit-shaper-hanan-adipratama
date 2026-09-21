import { Router } from 'express';
import type { AuthService } from '../auth/auth.service.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { createExportController } from './export.controller.js';
import type { ExportService } from './export.service.js';

export function createExportRoute(authService: AuthService, exportService: ExportService) {
  const router = Router();
  router.get('/', requireAuth(authService), createExportController(exportService));
  return router;
}
