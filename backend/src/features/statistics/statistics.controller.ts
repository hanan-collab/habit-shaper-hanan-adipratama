import type { RequestHandler } from 'express';
import { parseInput } from '../../common/validation.js';
import { statisticsParamsSchema } from './dto/request/statistics.request.js';
import type { StatisticsResponse } from './dto/response/statistics.response.js';
import type { AllStatisticsResponse } from './dto/response/statistics.response.js';
import { habitDetailResponse } from '../habits/habit.model.js';
import type { StatisticsService } from './statistics.service.js';

export type StatisticsController = { get: RequestHandler; all: RequestHandler };

export function createStatisticsController(service: StatisticsService): StatisticsController {
  return {
    all: async (request, response) => {
      const histories = await service.all(request.authUser!.id, request.authUser!.timezone);
      const result: AllStatisticsResponse = {
        histories: histories.map(({ habit, statistics }) => ({ habit: habitDetailResponse(habit), statistics })),
      };
      response.json(result);
    },
    get: async (request, response) => {
      const path = parseInput(statisticsParamsSchema, request.params, response, 'Request parameters are invalid');
      if (!path) return;
      const result: StatisticsResponse = {
        statistics: await service.get(request.authUser!.id, request.authUser!.timezone, path.habitId),
      };
      response.json(result);
    },
  };
}
