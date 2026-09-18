import type { Habit, HabitEvent } from '@prisma/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HabitEventKind, HabitKind } from '../features/habits/habit.enum.js';
import type { HabitRepository } from '../features/habits/habit.repository.js';
import { createHabitService } from '../features/habits/habit.service.js';

const habit: Habit = {
  id: 'habit-1', userId: 'user-1', name: 'Read', description: null, type: 'BUILD',
  startDate: new Date('2026-09-01T00:00:00.000Z'), createdAt: new Date(), updatedAt: new Date(),
};
const event: HabitEvent = {
  id: 'event-1', habitId: habit.id, type: 'COMPLETED', date: new Date('2026-09-18T00:00:00.000Z'),
  note: null, createdAt: new Date(),
};
let repository: HabitRepository;

beforeEach(() => {
  repository = {
    list: vi.fn(async () => [habit]),
    findDetail: vi.fn(async () => ({ ...habit, events: [] })),
    create: vi.fn(async (data) => ({ ...habit, ...data })),
    update: vi.fn(async (_id, data) => ({ ...habit, ...data } as Habit)),
    delete: vi.fn(async () => undefined),
    countEvents: vi.fn(async () => 0),
    findEarliestEvent: vi.fn(async () => null),
    upsertEvent: vi.fn(async (data) => ({ ...event, ...data })),
    deleteEvent: vi.fn(async () => undefined),
  };
});

describe('habit service', () => {
  test('rejects access to another user habit', async () => {
    repository.findDetail = vi.fn(async () => null);
    await expect(createHabitService(repository).get('other-user', habit.id))
      .rejects.toMatchObject({ status: 404, code: 'HABIT_NOT_FOUND' });
  });

  test('rejects incompatible events and future dates', async () => {
    const service = createHabitService(repository);
    await expect(service.putEvent('user-1', 'Asia/Jakarta', habit.id, '2026-09-18', HabitEventKind.Relapsed, {}))
      .rejects.toMatchObject({ code: 'HABIT_EVENT_TYPE_MISMATCH' });
    await expect(service.putEvent('user-1', 'Asia/Jakarta', habit.id, '2999-01-01', HabitEventKind.Completed, {}))
      .rejects.toMatchObject({ code: 'INVALID_HABIT_EVENT_DATE' });
  });

  test('upserts the valid event and preserves date-only response values', async () => {
    const result = await createHabitService(repository)
      .putEvent('user-1', 'Asia/Jakarta', habit.id, '2026-09-18', HabitEventKind.Completed, { note: 'done' });
    expect(result.date).toBe('2026-09-18');
    expect(repository.upsertEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'COMPLETED', note: 'done' }));
  });

  test('prevents changing type after events exist', async () => {
    repository.countEvents = vi.fn(async () => 1);
    await expect(createHabitService(repository).update('user-1', 'Asia/Jakarta', habit.id, { type: HabitKind.Break }))
      .rejects.toMatchObject({ code: 'HABIT_TYPE_HAS_EVENTS' });
  });
});
