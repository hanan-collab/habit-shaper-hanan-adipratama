import type { HabitType, Prisma } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import type { GamificationService } from '../gamification/gamification.service.js';
import { GamificationAction } from '../gamification/gamification.enum.js';
import { fromCalendarDate, todayInTimezone } from '../../common/calendar-date.js';
import type { CreateHabitRequest, UpdateHabitRequest } from './dto/request/habit.request.js';
import { HabitErrorCode } from './habit.enum.js';
import { habitDetailResponse, habitResponse } from './habit.model.js';
import type { HabitRepository } from './habit.repository.js';

export interface HabitService {
  list(userId: string): Promise<ReturnType<typeof habitResponse>[]>;
  get(userId: string, habitId: string): Promise<ReturnType<typeof habitDetailResponse>>;
  create(
    userId: string,
    timezone: string,
    input: CreateHabitRequest,
  ): Promise<{
    habit: ReturnType<typeof habitResponse>;
    meta: { gamificationEvents: ReturnType<GamificationService['evaluate']> };
  }>;
  update(
    userId: string,
    timezone: string,
    habitId: string,
    input: UpdateHabitRequest,
  ): Promise<ReturnType<typeof habitResponse>>;
}

export function createHabitService(repository: HabitRepository, gamification: GamificationService): HabitService {
  const find = async (userId: string, habitId: string) => {
    const habit = await repository.findDetail(userId, habitId);
    if (!habit) throw new AppError(404, HabitErrorCode.NotFound, 'Habit not found');
    return habit;
  };
  return {
    async list(userId) {
      return (await repository.list(userId)).map(habitResponse);
    },
    async get(userId, habitId) {
      return habitDetailResponse(await find(userId, habitId));
    },
    async create(userId, timezone, input) {
      const startDate = input.startDate ?? todayInTimezone(timezone);
      if (startDate > todayInTimezone(timezone)) {
        throw new AppError(400, HabitErrorCode.InvalidStartDate, 'Habit start date cannot be in the future');
      }
      const habit = habitResponse(
        await repository.create({
          userId,
          name: input.name,
          description: input.description,
          type: input.type as HabitType,
          startDate: fromCalendarDate(startDate),
        }),
      );
      return {
        habit,
        meta: {
          gamificationEvents: gamification.evaluate({
            action: GamificationAction.HabitCreated,
            habitId: habit.id,
            habitType: habit.type,
          }),
        },
      };
    },
    async update(userId, timezone, habitId, input) {
      const habit = await find(userId, habitId);
      if (input.startDate && input.startDate > todayInTimezone(timezone)) {
        throw new AppError(400, HabitErrorCode.InvalidStartDate, 'Habit start date cannot be in the future');
      }
      if (input.type && input.type !== habit.type && (await repository.countEvents(habitId)) > 0) {
        throw new AppError(409, HabitErrorCode.TypeHasEvents, 'Habit type cannot change after events exist');
      }
      if (input.startDate) {
        const earliest = await repository.findEarliestEvent(habitId);
        if (earliest && input.startDate > earliest.date.toISOString().slice(0, 10)) {
          throw new AppError(
            409,
            HabitErrorCode.InvalidStartDate,
            'Habit start date cannot be after an existing event',
          );
        }
      }
      const data: Prisma.HabitUpdateInput = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type as HabitType } : {}),
        ...(input.startDate !== undefined ? { startDate: fromCalendarDate(input.startDate) } : {}),
      };
      return habitResponse(await repository.update(habitId, data));
    },
  };
}
