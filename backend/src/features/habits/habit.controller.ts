import type { RequestHandler, Response } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import type { CompositionService } from '../composition/composition.service.js';
import {
  createHabitRequestSchema,
  habitIdParamsSchema,
  updateHabitGoalsRequestSchema,
  updateHabitRequestSchema,
} from './dto/request/habit.request.js';
import type { HabitService } from './habit.service.js';

const params = <T>(schema: Parameters<typeof parseInput<T>>[0], value: unknown, response: Response) =>
  parseInput(schema, value, response, 'Request parameters are invalid');

export type HabitController = {
  list: RequestHandler;
  get: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  updateGoals: RequestHandler;
  delete: RequestHandler;
};

export function createHabitController(service: HabitService, composition: CompositionService): HabitController {
  return {
    list: async (request, response) => response.json({ habits: await service.list(request.authUser!.id) }),
    get: async (request, response) => {
      const path = params(habitIdParamsSchema, request.params, response);
      if (!path) return;
      response.json({ habit: await service.get(request.authUser!.id, path.habitId) });
    },
    create: async (request, response) => {
      const input = parseBody(createHabitRequestSchema, request.body, response);
      if (!input) return;
      response.status(201).json(await composition.createHabit(request.authUser!.id, request.authUser!.timezone, input));
    },
    update: async (request, response) => {
      const path = params(habitIdParamsSchema, request.params, response);
      const input = parseBody(updateHabitRequestSchema, request.body, response);
      if (!path || !input) return;
      const habit = await service.update(request.authUser!.id, request.authUser!.timezone, path.habitId, input);
      response.json({ habit });
    },
    updateGoals: async (request, response) => {
      const path = params(habitIdParamsSchema, request.params, response);
      const input = parseBody(updateHabitGoalsRequestSchema, request.body, response);
      if (!path || !input) return;
      response.json(
        await composition.updateHabitGoals(request.authUser!.id, request.authUser!.timezone, path.habitId, input),
      );
    },
    delete: async (request, response) => {
      const path = params(habitIdParamsSchema, request.params, response);
      if (!path) return;
      await composition.deleteHabit(request.authUser!.id, request.authUser!.timezone, path.habitId);
      response.status(204).send();
    },
  };
}
