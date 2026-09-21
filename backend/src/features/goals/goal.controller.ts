import type { RequestHandler } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import { connectGoalDto, createGoalDto, createMultiGoalDto, goalIdParamsDto, habitGoalParamsDto, updateGoalDto } from './goal.dto.js';
import type { GoalService } from './goal.service.js';
import type { CompositionService } from '../composition/composition.service.js';

export type GoalController = {
  list: RequestHandler; create: RequestHandler; createMulti: RequestHandler; connect: RequestHandler; update: RequestHandler; delete: RequestHandler; cancel: RequestHandler;
};

export function createGoalController(service: GoalService, composition?: CompositionService): GoalController {
  return {
    list: async (request, response) => {
      response.json({ goals: await service.list(request.authUser!.id, request.authUser!.timezone) });
    },
    create: async (request, response) => {
      const path = parseInput(habitGoalParamsDto, request.params, response, 'Request parameters are invalid');
      const input = parseBody(createGoalDto, request.body, response);
      if (!path || !input) return;
      const goal = await service.create(request.authUser!.id, request.authUser!.timezone, path.habitId, input);
      response.status(201).json({ goal });
    },
    createMulti: async (request, response) => {
      const input = parseBody(createMultiGoalDto, request.body, response);
      if (!input) return;
      if (composition) response.status(201).json(await composition.createGoal(request.authUser!.id, request.authUser!.timezone, input));
      else response.status(201).json({ goal: await service.createMulti(request.authUser!.id, request.authUser!.timezone, input) });
    },
    connect: async (request, response) => {
      const path = parseInput(habitGoalParamsDto, request.params, response, 'Request parameters are invalid');
      const input = parseBody(connectGoalDto, request.body, response);
      if (!path || !input) return;
      response.json({ goals: await service.connectHabit(request.authUser!.id, request.authUser!.timezone, path.habitId, input.goalIds) });
    },
    update: async (request, response) => {
      const path = parseInput(goalIdParamsDto, request.params, response, 'Request parameters are invalid');
      const input = parseBody(updateGoalDto, request.body, response);
      if (!path || !input) return;
      if (composition) response.json(await composition.updateGoal(request.authUser!.id, request.authUser!.timezone, path.goalId, input));
      else response.json({ goal: await service.update(request.authUser!.id, request.authUser!.timezone, path.goalId, input) });
    },
    delete: async (request, response) => {
      const path = parseInput(goalIdParamsDto, request.params, response, 'Request parameters are invalid');
      if (!path) return;
      await service.delete(request.authUser!.id, path.goalId);
      response.status(204).send();
    },
    cancel: async (request, response) => {
      const path = parseInput(goalIdParamsDto, request.params, response, 'Request parameters are invalid');
      if (!path) return;
      response.json({ goal: await service.cancel(request.authUser!.id, request.authUser!.timezone, path.goalId) });
    },
  };
}
