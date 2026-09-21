import type { RequestHandler } from 'express';
import { HealthStatus } from './health.enum.js';
import type { HealthResponse } from './dto/response/health.response.js';
import type { HealthService } from './health.service.js';

export type HealthController = { get: RequestHandler };

export function createHealthController(service: HealthService): HealthController {
  return {
    get: async (_request, response) => {
      const result: HealthResponse = await service.getHealth();
      response.status(result.status === HealthStatus.Ok ? 200 : 503).json(result);
    },
  };
}
