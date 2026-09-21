import type { Goal, Habit, HabitEvent } from '@prisma/client';
import { expect, test } from 'vitest';
import type { GoalService } from '../features/goals/goal.service.js';
import type { DashboardRepository } from '../features/dashboard/dashboard.repository.js';
import { createDashboardService } from '../features/dashboard/dashboard.service.js';
import { createStatisticsService } from '../features/statistics/statistics.service.js';
import { createUserStatisticsService } from '../features/user-statistics/user-statistics.service.js';

const today = new Date().toISOString().slice(0, 10);
const baseHabit = (type: Habit['type'], id: string): Habit => ({
  id,
  userId: 'user-1',
  name: id,
  description: null,
  type,
  startDate: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
});
const completion: HabitEvent = {
  id: 'event-1',
  habitId: 'build',
  type: 'COMPLETED',
  date: new Date(`${today}T00:00:00Z`),
  note: null,
  createdAt: new Date(),
};
const activeGoal: Goal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Goal',
  targetDays: 7,
  deadline: null,
  status: 'ACTIVE',
  completedDate: null,
  finalProgressDays: null,
  lastEvaluatedDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('dashboard aggregates daily state, statistics, and active goal summary', async () => {
  const build = { ...baseHabit('BUILD', 'build'), events: [completion] };
  const breaking = { ...baseHabit('BREAK', 'break'), events: [] };
  const repository: DashboardRepository = { listHabits: async () => [build, breaking] };
  const statistics = createStatisticsService({ findSource: async () => null, listSources: async () => [] });
  const goals = {
    list: async () => [
      {
        ...activeGoal,
        deadline: null,
        completedDate: null,
        todayStatus: 'COMPLETE',
        habits: [{ id: 'build', name: 'build', type: 'BUILD', connectedOn: today, todayStatus: 'DONE' }],
        progress: { currentDays: 1, remainingDays: 6, percentage: 14.29, overdue: false },
      },
    ],
  } as unknown as GoalService;
  const result = await createDashboardService(repository, statistics, goals, createUserStatisticsService()).get(
    'user-1',
    'UTC',
  );
  expect(result.summary).toEqual({ activeHabits: 2, activeGoals: 1 });
  expect(result.habits).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'build', todayStatus: 'COMPLETED', activeGoalId: 'goal-1' }),
      expect.objectContaining({ id: 'break', todayStatus: 'CLEAN', activeGoalId: null }),
    ]),
  );
  expect(result.userStatistics).toEqual({
    totalBuildCompletions: 1,
    totalGoalsCompleted: 0,
    bestBuildStreak: 1,
    bestBreakStreak: expect.any(Number),
    bestOverallStreak: expect.any(Number),
  });
});

test('keeps a habit trackable after its connected goal is completed', async () => {
  const build = { ...baseHabit('BUILD', 'build'), events: [completion] };
  const repository: DashboardRepository = { listHabits: async () => [build] };
  const statistics = createStatisticsService({ findSource: async () => null, listSources: async () => [] });
  const goals = {
    list: async () => [
      {
        ...activeGoal,
        status: 'COMPLETED',
        todayStatus: 'COMPLETE',
        habits: [{ id: 'build', name: 'build', type: 'BUILD', connectedOn: today, todayStatus: 'DONE' }],
        progress: { currentDays: 7, remainingDays: 0, percentage: 100, overdue: false },
      },
    ],
  } as unknown as GoalService;
  const result = await createDashboardService(repository, statistics, goals, createUserStatisticsService()).get(
    'user-1',
    'UTC',
  );
  expect(result.summary).toEqual({ activeHabits: 1, activeGoals: 0 });
  expect(result.goals).toEqual([]);
  expect(result.habits[0]).toMatchObject({ id: 'build', todayStatus: 'COMPLETED', activeGoalId: null });
});
