import type { Goal, Habit } from '@prisma/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GoalState } from '../features/goals/goal.enum.js';
import type { GoalRepository } from '../features/goals/goal.repository.js';
import { createGoalService } from '../features/goals/goal.service.js';
import { createStatisticsService } from '../features/statistics/statistics.service.js';

const habit: Habit & { events: [] } = {
  id: 'habit-1', userId: 'user-1', name: 'Read', description: null, type: 'BUILD',
  startDate: new Date('2026-09-01T00:00:00.000Z'), createdAt: new Date(), updatedAt: new Date(), events: [],
};
const goal: Goal = {
  id: 'goal-1', habitId: habit.id, title: 'Seven days', targetStreakDays: 7, deadline: null,
  status: 'ACTIVE', activeSlot: 1, completedDate: null, createdAt: new Date(), updatedAt: new Date(),
};
let repository: GoalRepository;

beforeEach(() => {
  repository = {
    list: vi.fn(async () => []),
    find: vi.fn(async () => ({ ...goal, habit })),
    findHabit: vi.fn(async () => habit),
    findActive: vi.fn(async () => null),
    create: vi.fn(async (data) => ({ ...goal, ...data })),
    update: vi.fn(async (_id, data) => ({ ...goal, ...data } as Goal)),
    delete: vi.fn(async () => undefined),
  };
});

const service = () => createGoalService(repository, createStatisticsService({ findSource: async () => habit }, () => new Date('2026-09-19T00:00:00Z')));

describe('goal service', () => {
  test('creates an active goal with calculated progress', async () => {
    const result = await service().create('user-1', 'UTC', habit.id, { title: 'Seven days', targetStreakDays: 7 });
    expect(result).toMatchObject({ status: 'ACTIVE', progress: { currentStreak: 0, remainingDays: 7, percentage: 0, overdue: false } });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ activeSlot: 1 }));
  });

  test('rejects a second active goal', async () => {
    repository.findActive = vi.fn(async () => ({ ...goal, habit }));
    await expect(service().create('user-1', 'UTC', habit.id, { title: 'Other', targetStreakDays: 2 }))
      .rejects.toMatchObject({ status: 409, code: 'ACTIVE_GOAL_EXISTS' });
  });

  test('cancels an active goal and releases its active slot', async () => {
    const result = await service().cancel('user-1', 'UTC', goal.id);
    expect(result.status).toBe(GoalState.Cancelled);
    expect(repository.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({ activeSlot: null }));
  });

  test('rejects past deadlines', async () => {
    await expect(service().create('user-1', 'UTC', habit.id, {
      title: 'Expired', targetStreakDays: 2, deadline: '2020-01-01',
    })).rejects.toMatchObject({ code: 'INVALID_GOAL_DEADLINE' });
  });
});
