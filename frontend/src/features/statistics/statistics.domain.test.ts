import { describe, expect, test } from 'vitest';
import type { Habit, HabitStatistics } from '../../types/domain';
import { aggregateRange } from './statistics.domain';
const baseHabit: Habit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Read',
  description: null,
  type: 'BUILD',
  startDate: '2026-09-17',
  createdAt: '',
  updatedAt: '',
  events: [{ id: 'event-1', habitId: 'habit-1', type: 'COMPLETED', date: '2026-09-18', note: null, createdAt: '' }],
};
const stats: HabitStatistics = {
  habitId: 'habit-1',
  type: 'BUILD',
  currentStreak: 1,
  longestStreak: 4,
  totalCompletions: 1,
  completedThisWeek: 1,
  missedThisWeek: 1,
  eligibleDaysThisWeek: 2,
  weeklyCompletionRate: 50,
  weekly: {
    period: 'CURRENT_WEEK',
    startDate: '2026-09-17',
    endDate: '2026-09-18',
    completedDays: 1,
    missedDays: 1,
    eligibleDays: 2,
    completionRate: 50,
  },
  lastRelapse: null,
  lastRelapseDate: null,
};
describe('statistics range aggregation', () => {
  test('uses recorded events and excludes dates before habit start', () => {
    const result = aggregateRange([{ habit: baseHabit, statistics: stats }], 7, '2026-09-18');
    expect(result).toMatchObject({ eligible: 2, completed: 1, missed: 1, rate: 50, currentStreak: 1, personalBest: 4 });
    expect(result.series.slice(0, 5).every((day) => day.eligible === 0)).toBe(true);
  });
  test('treats a BREAK day without relapse as clean', () => {
    const result = aggregateRange(
      [{ habit: { ...baseHabit, type: 'BREAK', events: [] }, statistics: { ...stats, type: 'BREAK' } }],
      2,
      '2026-09-18',
    );
    expect(result).toMatchObject({ eligible: 2, completed: 2, rate: 100 });
  });
});
