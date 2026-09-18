import type { HabitEventType, HabitType, Prisma } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import type { CreateHabitDto, HabitEventDto, UpdateHabitDto } from './habit.dto.js';
import { toDateOnly } from './habit.dto.js';
import { HabitErrorCode, HabitEventKind, HabitKind } from './habit.enum.js';
import { eventResponse, habitDetailResponse, habitResponse } from './habit.model.js';
import type { HabitRepository } from './habit.repository.js';

export interface HabitService {
  list(userId: string): Promise<ReturnType<typeof habitResponse>[]>;
  get(userId: string, habitId: string): Promise<ReturnType<typeof habitDetailResponse>>;
  create(userId: string, timezone: string, input: CreateHabitDto): Promise<ReturnType<typeof habitResponse>>;
  update(userId: string, timezone: string, habitId: string, input: UpdateHabitDto): Promise<ReturnType<typeof habitResponse>>;
  delete(userId: string, habitId: string): Promise<void>;
  putEvent(userId: string, timezone: string, habitId: string, date: string, kind: HabitEventKind, input: HabitEventDto): Promise<ReturnType<typeof eventResponse>>;
  deleteEvent(userId: string, habitId: string, date: string, kind: HabitEventKind): Promise<void>;
}

function todayIn(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

const expectedHabitKind = (event: HabitEventKind) => event === HabitEventKind.Completed ? HabitKind.Build : HabitKind.Break;

export function createHabitService(repository: HabitRepository): HabitService {
  const find = async (userId: string, habitId: string) => {
    const habit = await repository.findDetail(userId, habitId);
    if (!habit) throw new AppError(404, HabitErrorCode.NotFound, 'Habit not found');
    return habit;
  };
  return {
    async list(userId) { return (await repository.list(userId)).map(habitResponse); },
    async get(userId, habitId) { return habitDetailResponse(await find(userId, habitId)); },
    async create(userId, timezone, input) {
      if (input.startDate > todayIn(timezone)) {
        throw new AppError(400, HabitErrorCode.InvalidStartDate, 'Habit start date cannot be in the future');
      }
      return habitResponse(await repository.create({
        userId, name: input.name, description: input.description, type: input.type as HabitType,
        startDate: toDateOnly(input.startDate),
      }));
    },
    async update(userId, timezone, habitId, input) {
      const habit = await find(userId, habitId);
      if (input.startDate && input.startDate > todayIn(timezone)) {
        throw new AppError(400, HabitErrorCode.InvalidStartDate, 'Habit start date cannot be in the future');
      }
      if (input.type && input.type !== habit.type && await repository.countEvents(habitId) > 0) {
        throw new AppError(409, HabitErrorCode.TypeHasEvents, 'Habit type cannot change after events exist');
      }
      if (input.startDate) {
        const earliest = await repository.findEarliestEvent(habitId);
        if (earliest && input.startDate > earliest.date.toISOString().slice(0, 10)) {
          throw new AppError(409, HabitErrorCode.InvalidStartDate, 'Habit start date cannot be after an existing event');
        }
      }
      const data: Prisma.HabitUpdateInput = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type as HabitType } : {}),
        ...(input.startDate !== undefined ? { startDate: toDateOnly(input.startDate) } : {}),
      };
      return habitResponse(await repository.update(habitId, data));
    },
    async delete(userId, habitId) {
      await find(userId, habitId);
      await repository.delete(habitId);
    },
    async putEvent(userId, timezone, habitId, date, kind, input) {
      const habit = await find(userId, habitId);
      if (habit.type !== expectedHabitKind(kind)) {
        throw new AppError(409, HabitErrorCode.WrongEventType, `${habit.type} habits do not accept ${kind} events`);
      }
      const start = habit.startDate.toISOString().slice(0, 10);
      if (date < start || date > todayIn(timezone)) {
        throw new AppError(400, HabitErrorCode.InvalidEventDate, 'Event date must be between the habit start date and today');
      }
      return eventResponse(await repository.upsertEvent({
        habitId, type: kind as HabitEventType, date: toDateOnly(date), note: input.note,
      }));
    },
    async deleteEvent(userId, habitId, date, kind) {
      const habit = await find(userId, habitId);
      if (habit.type !== expectedHabitKind(kind)) {
        throw new AppError(409, HabitErrorCode.WrongEventType, `${habit.type} habits do not accept ${kind} events`);
      }
      await repository.deleteEvent(habitId, toDateOnly(date), kind as HabitEventType);
    },
  };
}
