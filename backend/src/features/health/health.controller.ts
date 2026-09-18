import type { RequestHandler } from 'express';
import { HealthStatus } from './health.enum.js';
import type { HealthResponseDto } from './health.dto.js';
import type { HealthService } from './health.service.js';

export type HealthController = { get: RequestHandler };

export function createHealthController(service: HealthService): HealthController {
  return {
    get: async (_request, response) => {
      const result: HealthResponseDto = await service.getHealth();
      response.status(result.status === HealthStatus.Ok ? 200 : 503).json(result);
    },
  };
}
