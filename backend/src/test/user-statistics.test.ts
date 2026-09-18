import { describe, expect, test } from 'vitest';
import { StatisticsPeriod } from '../features/statistics/statistics.enum.js';
import type { HabitStatisticsModel } from '../features/statistics/statistics.model.js';
import { createUserStatisticsService } from '../features/user-statistics/user-statistics.service.js';

const statistics = (longestStreak: number, totalCompletions = 0): HabitStatisticsModel => ({
  habitId: crypto.randomUUID(), type: 'BUILD', currentStreak: longestStreak, longestStreak, totalCompletions,
  completedThisWeek: 0, missedThisWeek: 0, eligibleDaysThisWeek: 0, weeklyCompletionRate: 0,
  weekly: { period: StatisticsPeriod.CurrentWeek, startDate: '2026-09-14', endDate: '2026-09-19', completedDays: 0, missedDays: 0, eligibleDays: 0, completionRate: 0 },
  lastRelapse: null, lastRelapseDate: null,
});

describe('user statistics service', () => {
  test('returns zero values when the user has no habits or completed goals', () => {
    expect(createUserStatisticsService().aggregate([], 0)).toEqual({
      totalBuildCompletions: 0, totalGoalsCompleted: 0,
      bestBuildStreak: 0, bestBreakStreak: 0, bestOverallStreak: 0,
    });
  });

  test('aggregates BUILD completions, completed goals, and streak records by habit type', () => {
    const result = createUserStatisticsService().aggregate([
      { type: 'BUILD', statistics: statistics(4, 9) },
      { type: 'BUILD', statistics: statistics(7, 12) },
      { type: 'BREAK', statistics: { ...statistics(11), type: 'BREAK' } },
    ], 3);
    expect(result).toEqual({
      totalBuildCompletions: 21, totalGoalsCompleted: 3,
      bestBuildStreak: 7, bestBreakStreak: 11, bestOverallStreak: 11,
    });
  });
});
