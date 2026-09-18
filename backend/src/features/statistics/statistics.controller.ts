import type { RequestHandler } from 'express';
import { parseInput } from '../../common/validation.js';
import { statisticsParamsDto, type StatisticsResponseDto } from './statistics.dto.js';
import type { StatisticsService } from './statistics.service.js';

export type StatisticsController = { get: RequestHandler };

export function createStatisticsController(service: StatisticsService): StatisticsController {
  return {
    get: async (request, response) => {
      const path = parseInput(statisticsParamsDto, request.params, response, 'Request parameters are invalid');
      if (!path) return;
      const result: StatisticsResponseDto = {
        statistics: await service.get(request.authUser!.id, request.authUser!.timezone, path.habitId),
      };
      response.json(result);
    },
  };
}
