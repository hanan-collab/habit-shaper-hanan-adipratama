import type { RequestHandler, Response } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import { createHabitDto, habitIdParamsDto, updateHabitDto } from './habit.dto.js';
import type { HabitService } from './habit.service.js';

const params = <T>(schema: Parameters<typeof parseInput<T>>[0], value: unknown, response: Response) =>
  parseInput(schema, value, response, 'Request parameters are invalid');

export type HabitController = {
  list: RequestHandler; get: RequestHandler; create: RequestHandler; update: RequestHandler; delete: RequestHandler;
};

export function createHabitController(service: HabitService): HabitController {
  return {
    list: async (request, response) => response.json({ habits: await service.list(request.authUser!.id) }),
    get: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      if (!path) return;
      response.json({ habit: await service.get(request.authUser!.id, path.habitId) });
    },
    create: async (request, response) => {
      const input = parseBody(createHabitDto, request.body, response);
      if (!input) return;
      const result = await service.create(request.authUser!.id, request.authUser!.timezone, input);
      response.status(201).json(result);
    },
    update: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      const input = parseBody(updateHabitDto, request.body, response);
      if (!path || !input) return;
      const habit = await service.update(request.authUser!.id, request.authUser!.timezone, path.habitId, input);
      response.json({ habit });
    },
    delete: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      if (!path) return;
      await service.delete(request.authUser!.id, path.habitId);
      response.status(204).send();
    },
  };
}
