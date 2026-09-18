import type { RequestHandler, Response } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import { createHabitDto, habitEventDto, habitEventParamsDto, habitIdParamsDto, updateHabitDto } from './habit.dto.js';
import { HabitEventKind } from './habit.enum.js';
import type { HabitService } from './habit.service.js';

const params = <T>(schema: Parameters<typeof parseInput<T>>[0], value: unknown, response: Response) =>
  parseInput(schema, value, response, 'Request parameters are invalid');

export type HabitController = {
  list: RequestHandler; get: RequestHandler; create: RequestHandler; update: RequestHandler; delete: RequestHandler;
  putCompletion: RequestHandler; deleteCompletion: RequestHandler; putRelapse: RequestHandler; deleteRelapse: RequestHandler;
};

export function createHabitController(service: HabitService): HabitController {
  const putEvent = (kind: HabitEventKind): RequestHandler => async (request, response) => {
    const path = params(habitEventParamsDto, request.params, response);
    const input = parseBody(habitEventDto, request.body, response);
    if (!path || !input) return;
    const event = await service.putEvent(request.authUser!.id, request.authUser!.timezone, path.habitId, path.date, kind, input);
    response.json({ event });
  };
  const deleteEvent = (kind: HabitEventKind): RequestHandler => async (request, response) => {
    const path = params(habitEventParamsDto, request.params, response);
    if (!path) return;
    await service.deleteEvent(request.authUser!.id, path.habitId, path.date, kind);
    response.status(204).send();
  };
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
      const habit = await service.create(request.authUser!.id, request.authUser!.timezone, input);
      response.status(201).json({ habit });
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
    putCompletion: putEvent(HabitEventKind.Completed),
    deleteCompletion: deleteEvent(HabitEventKind.Completed),
    putRelapse: putEvent(HabitEventKind.Relapsed),
    deleteRelapse: deleteEvent(HabitEventKind.Relapsed),
  };
}
