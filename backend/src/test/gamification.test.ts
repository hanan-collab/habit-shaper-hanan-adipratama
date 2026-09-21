import { describe, expect, test } from 'vitest';
import { GamificationAction, GamificationEventType } from '../features/gamification/gamification.enum.js';
import type { GoalGamificationState } from '../features/gamification/gamification.model.js';
import { createGamificationService } from '../features/gamification/gamification.service.js';
import { StatisticsPeriod } from '../features/statistics/statistics.enum.js';
import type { HabitStatisticsModel } from '../features/statistics/statistics.model.js';

const stats = (overrides: Partial<HabitStatisticsModel> = {}): HabitStatisticsModel => ({
  habitId: 'habit-1',
  type: 'BUILD',
  currentStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  completedThisWeek: 0,
  missedThisWeek: 1,
  eligibleDaysThisWeek: 1,
  weeklyCompletionRate: 0,
  weekly: {
    period: StatisticsPeriod.CurrentWeek,
    startDate: '2026-09-14',
    endDate: '2026-09-19',
    completedDays: 0,
    missedDays: 1,
    eligibleDays: 1,
    completionRate: 0,
  },
  lastRelapse: null,
  lastRelapseDate: null,
  ...overrides,
});
const goal = (overrides: Partial<GoalGamificationState> = {}): GoalGamificationState => ({
  id: 'goal-1',
  status: 'ACTIVE',
  currentProgress: 2,
  targetDays: 7,
  percentage: 28.57,
  remainingDays: 5,
  ...overrides,
});
const service = createGamificationService();

describe('gamification service', () => {
  test('returns no events for an idempotent completion retry', () => {
    expect(
      service.evaluate({
        action: GamificationAction.BuildCompleted,
        eventCreated: false,
        habitId: 'habit-1',
        before: stats(),
        after: stats(),
        goalBefore: null,
        goalAfter: null,
        localDate: '2026-09-19',
      }),
    ).toEqual([]);
  });

  test('detects first check-in, streak start, and personal best', () => {
    const result = service.evaluate({
      action: GamificationAction.BuildCompleted,
      eventCreated: true,
      habitId: 'habit-1',
      before: stats(),
      after: stats({ currentStreak: 1, longestStreak: 1, totalCompletions: 1 }),
      goalBefore: null,
      goalAfter: null,
      localDate: '2026-09-19',
    });
    expect(result.map(({ type }) => type)).toEqual([
      GamificationEventType.PersonalBest,
      GamificationEventType.FirstCheckIn,
      GamificationEventType.StreakStarted,
      GamificationEventType.DailyCompletion,
    ]);
  });

  test('detects milestone, goal transitions, perfect week, and orders collisions', () => {
    const result = service.evaluate({
      action: GamificationAction.BuildCompleted,
      eventCreated: true,
      habitId: 'habit-1',
      before: stats({ currentStreak: 6, longestStreak: 6, totalCompletions: 6 }),
      after: stats({
        currentStreak: 7,
        longestStreak: 7,
        totalCompletions: 7,
        completedThisWeek: 7,
        eligibleDaysThisWeek: 7,
      }),
      goalBefore: goal({ currentProgress: 6, percentage: 85.71, remainingDays: 1 }),
      goalAfter: goal({ status: 'COMPLETED', currentProgress: 7, percentage: 100, remainingDays: 0 }),
      localDate: '2026-09-20',
    });
    expect(result.map(({ type }) => type)).toEqual([
      GamificationEventType.GoalCompleted,
      GamificationEventType.StreakMilestone,
      GamificationEventType.PerfectWeek,
      GamificationEventType.PersonalBest,
      GamificationEventType.DailyCompletion,
    ]);
  });

  test('detects halfway and near-goal crossings without a normal-day milestone', () => {
    const result = service.evaluate({
      action: GamificationAction.BuildCompleted,
      eventCreated: true,
      habitId: 'habit-1',
      before: stats({ currentStreak: 4, longestStreak: 5, totalCompletions: 5 }),
      after: stats({ currentStreak: 5, longestStreak: 5, totalCompletions: 6 }),
      goalBefore: goal({ currentProgress: 4, targetDays: 6, percentage: 40, remainingDays: 2 }),
      goalAfter: goal({ currentProgress: 5, targetDays: 6, percentage: 83.33, remainingDays: 1 }),
      localDate: '2026-09-19',
    });
    expect(result.map(({ type }) => type)).toEqual([
      GamificationEventType.GoalHalfway,
      GamificationEventType.GoalNearlyReached,
      GamificationEventType.DailyCompletion,
    ]);
  });

  test('relapse only returns the recovery event', () => {
    expect(
      service.evaluate({
        action: GamificationAction.BreakRelapsed,
        eventCreated: true,
        habitId: 'habit-1',
        previousValue: 12,
      }),
    ).toEqual([
      expect.objectContaining({
        type: GamificationEventType.RelapseRecorded,
        level: 'RECOVERY',
        previousValue: 12,
        value: 0,
      }),
    ]);
  });
});
