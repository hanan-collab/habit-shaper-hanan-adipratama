import type { Habit, HabitEvent } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { createStatisticsService } from '../features/statistics/statistics.service.js';
import type { StatisticsRepository } from '../features/statistics/statistics.repository.js';

const habit = (type: Habit['type'], startDate = '2026-09-14'): Habit => ({
  id: 'habit-1', userId: 'user-1', name: 'Habit', description: null, type,
  startDate: new Date(`${startDate}T00:00:00.000Z`), createdAt: new Date(), updatedAt: new Date(),
});
const event = (type: HabitEvent['type'], date: string): HabitEvent => ({
  id: `${type}-${date}`, habitId: 'habit-1', type, date: new Date(`${date}T00:00:00.000Z`), note: null, createdAt: new Date(),
});
const repository = (source: Awaited<ReturnType<StatisticsRepository['findSource']>>): StatisticsRepository => ({
  findSource: async () => source,
});
const now = () => new Date('2026-09-18T12:00:00.000Z');

describe('statistics service', () => {
  test('calculates BUILD current/longest streak and current-week completion', async () => {
    const source = {
      ...habit('BUILD'),
      events: [
        event('COMPLETED', '2026-09-14'), event('COMPLETED', '2026-09-15'),
        event('COMPLETED', '2026-09-17'), event('COMPLETED', '2026-09-18'),
      ],
    };
    const result = await createStatisticsService(repository(source), now).get('user-1', 'UTC', 'habit-1');
    expect(result).toMatchObject({
      currentStreak: 2, longestStreak: 2,
      weekly: { startDate: '2026-09-14', endDate: '2026-09-18', completedDays: 4, missedDays: 1, completionRate: 80 },
      lastRelapse: null,
    });
  });

  test('calculates BREAK clean intervals and last relapse', async () => {
    const source = {
      ...habit('BREAK', '2026-09-10'),
      events: [event('RELAPSED', '2026-09-13'), event('RELAPSED', '2026-09-16')],
    };
    const result = await createStatisticsService(repository(source), now).get('user-1', 'UTC', 'habit-1');
    expect(result).toMatchObject({
      currentStreak: 2, longestStreak: 3, lastRelapse: '2026-09-16',
      weekly: { completedDays: 4, missedDays: 1, completionRate: 80 },
    });
  });

  test('does not expose another user habit', async () => {
    await expect(createStatisticsService(repository(null), now).get('other', 'UTC', 'habit-1'))
      .rejects.toMatchObject({ status: 404, code: 'STATISTICS_HABIT_NOT_FOUND' });
  });
});
