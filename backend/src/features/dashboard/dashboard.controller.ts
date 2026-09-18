import type { RequestHandler } from 'express';
import type { DashboardResponseDto } from './dashboard.dto.js';
import type { DashboardService } from './dashboard.service.js';

export type DashboardController = { get: RequestHandler };

export function createDashboardController(service: DashboardService): DashboardController {
  return {
    get: async (request, response) => {
      const result: DashboardResponseDto = {
        dashboard: await service.get(request.authUser!.id, request.authUser!.timezone),
      };
      response.json(result);
    },
  };
}
