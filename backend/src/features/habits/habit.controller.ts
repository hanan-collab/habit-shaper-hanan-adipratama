import type { RequestHandler, Response } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import { createHabitDto, habitIdParamsDto, updateHabitDto, updateHabitGoalsDto } from './habit.dto.js';
import type { HabitService } from './habit.service.js';
import type { CompositionService } from '../composition/composition.service.js';

const params = <T>(schema: Parameters<typeof parseInput<T>>[0], value: unknown, response: Response) =>
  parseInput(schema, value, response, 'Request parameters are invalid');

export type HabitController = {
  list: RequestHandler; get: RequestHandler; create: RequestHandler; update: RequestHandler; updateGoals: RequestHandler; delete: RequestHandler;
};

export function createHabitController(service: HabitService, composition?: CompositionService): HabitController {
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
      const result = composition
        ? await composition.createHabit(request.authUser!.id, request.authUser!.timezone, input)
        : await service.create(request.authUser!.id, request.authUser!.timezone, input);
      response.status(201).json(result);
    },
    update: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      const input = parseBody(updateHabitDto, request.body, response);
      if (!path || !input) return;
      const habit = await service.update(request.authUser!.id, request.authUser!.timezone, path.habitId, input);
      response.json({ habit });
    },
    updateGoals: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      const input = parseBody(updateHabitGoalsDto, request.body, response);
      if (!path || !input) return;
      if (!composition) { response.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Composition service is unavailable' } }); return; }
      response.json(await composition.updateHabitGoals(request.authUser!.id, request.authUser!.timezone, path.habitId, input));
    },
    delete: async (request, response) => {
      const path = params(habitIdParamsDto, request.params, response);
      if (!path) return;
      await service.delete(request.authUser!.id, path.habitId, request.authUser!.timezone);
      response.status(204).send();
    },
  };
}
