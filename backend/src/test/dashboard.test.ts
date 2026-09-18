import type { Goal, Habit, HabitEvent } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import type { GoalService } from '../features/goals/goal.service.js';
import type { DashboardRepository } from '../features/dashboard/dashboard.repository.js';
import { createDashboardService } from '../features/dashboard/dashboard.service.js';
import { createStatisticsService } from '../features/statistics/statistics.service.js';

const today = new Date().toISOString().slice(0, 10);
const baseHabit = (type: Habit['type'], id: string): Habit => ({
  id, userId: 'user-1', name: id, description: null, type,
  startDate: new Date('2026-01-01T00:00:00Z'), createdAt: new Date(), updatedAt: new Date(),
});
const completion: HabitEvent = {
  id: 'event-1', habitId: 'build', type: 'COMPLETED', date: new Date(`${today}T00:00:00Z`), note: null, createdAt: new Date(),
};
const activeGoal: Goal = {
  id: 'goal-1', habitId: 'build', title: 'Goal', targetStreakDays: 7, deadline: null,
  status: 'ACTIVE', activeSlot: 1, completedDate: null, createdAt: new Date(), updatedAt: new Date(),
};

test('dashboard aggregates daily state, statistics, and active goal summary', async () => {
  const build = { ...baseHabit('BUILD', 'build'), events: [completion], goals: [activeGoal] };
  const breaking = { ...baseHabit('BREAK', 'break'), events: [], goals: [] };
  const repository: DashboardRepository = { listHabits: async () => [build, breaking] };
  const statistics = createStatisticsService({ findSource: async () => null });
  const goals = {
    list: async () => [{ ...activeGoal, activeSlot: undefined, deadline: null, completedDate: null, progress: { currentStreak: 1, remainingDays: 6, percentage: 14.29, overdue: false } }],
  } as unknown as GoalService;
  const result = await createDashboardService(repository, statistics, goals).get('user-1', 'UTC');
  expect(result.summary).toEqual({ activeHabits: 2, activeGoals: 1 });
  expect(result.habits).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'build', todayStatus: 'COMPLETED', activeGoalId: 'goal-1' }),
    expect.objectContaining({ id: 'break', todayStatus: 'CLEAN', activeGoalId: null }),
  ]));
});
