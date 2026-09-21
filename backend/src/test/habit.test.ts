import type { Habit } from '@prisma/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createGamificationService } from '../features/gamification/gamification.service.js';
import { HabitKind } from '../features/habits/habit.enum.js';
import type { HabitRepository } from '../features/habits/habit.repository.js';
import { createHabitService } from '../features/habits/habit.service.js';

const habit: Habit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Read',
  description: null,
  type: 'BUILD',
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};
let repository: HabitRepository;

beforeEach(() => {
  repository = {
    list: vi.fn(async () => [habit]),
    findDetail: vi.fn(async () => ({ ...habit, events: [] })),
    create: vi.fn(async (data) => ({ ...habit, ...data })),
    update: vi.fn(async (_id, data) => ({ ...habit, ...data }) as Habit),
    delete: vi.fn(async () => undefined),
    countEvents: vi.fn(async () => 0),
    findEarliestEvent: vi.fn(async () => null),
  };
});

const service = () => createHabitService(repository, createGamificationService());

describe('habit service', () => {
  test('rejects access to another user habit', async () => {
    repository.findDetail = vi.fn(async () => null);
    await expect(service().get('other-user', habit.id)).rejects.toMatchObject({ status: 404, code: 'HABIT_NOT_FOUND' });
  });

  test('returns semantic gamification metadata when a habit is created', async () => {
    const startDate = new Date().toISOString().slice(0, 10);
    const result = await service().create('user-1', 'UTC', { name: 'Read', type: HabitKind.Build, startDate });
    expect(result.habit.name).toBe('Read');
    expect(result.meta.gamificationEvents).toEqual([
      expect.objectContaining({ type: 'HABIT_CREATED', habitId: habit.id, habitType: 'BUILD' }),
    ]);
  });

  test('prevents changing type after events exist', async () => {
    repository.countEvents = vi.fn(async () => 1);
    await expect(service().update('user-1', 'Asia/Jakarta', habit.id, { type: HabitKind.Break })).rejects.toMatchObject(
      { code: 'HABIT_TYPE_HAS_EVENTS' },
    );
  });
});
