import type { RequestHandler } from 'express';
import type { ExportService } from './export.service.js';

export function createExportController(service: ExportService): RequestHandler {
  return async (request, response) => response.json(await service.get(request.authUser!.id));
}
