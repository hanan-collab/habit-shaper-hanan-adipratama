import type { Goal, Habit, HabitEvent } from '@prisma/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createGamificationService } from '../features/gamification/gamification.service.js';
import type { GoalService } from '../features/goals/goal.service.js';
import { createStatisticsService } from '../features/statistics/statistics.service.js';
import { TrackingEventKind } from '../features/tracking/tracking.enum.js';
import type { TrackingRepository } from '../features/tracking/tracking.repository.js';
import { createTrackingService } from '../features/tracking/tracking.service.js';

const today = new Date().toISOString().slice(0, 10);
const habit = (type: Habit['type']): Habit => ({
  id: 'habit-1', userId: 'user-1', name: 'Habit', description: null, type,
  startDate: new Date(`${today}T00:00:00.000Z`), createdAt: new Date(), updatedAt: new Date(),
});
const event = (type: HabitEvent['type']): HabitEvent => ({
  id: 'event-1', habitId: 'habit-1', type, date: new Date(`${today}T00:00:00.000Z`),
  note: null, createdAt: new Date(),
});
let source: Habit & { events: HabitEvent[]; goals: Goal[] };
let repository: TrackingRepository;
let goalService: GoalService;

beforeEach(() => {
  source = { ...habit('BUILD'), events: [], goals: [] };
  repository = {
    findSource: vi.fn(async () => source),
    putEvent: vi.fn(async (data) => ({ event: { ...event(data.type), ...data }, created: true })),
    deleteEvent: vi.fn(async () => undefined),
  };
  goalService = {
    gamificationState: vi.fn(),
    syncAfterStreakChange: vi.fn(async () => null),
  } as unknown as GoalService;
});

const service = () => createTrackingService(
  repository,
  createStatisticsService({ findSource: async () => null }),
  goalService,
  createGamificationService(),
);

describe('tracking service', () => {
  test('creates a BUILD completion with fresh stats and semantic events', async () => {
    const result = await service().put('user-1', 'UTC', source.id, today, TrackingEventKind.Completed, {});
    expect(result.data.stats).toMatchObject({ currentStreak: 1, totalCompletions: 1 });
    expect(result.meta.gamificationEvents.map(({ type }) => type)).toEqual([
      'PERSONAL_BEST', 'FIRST_CHECK_IN', 'STREAK_STARTED', 'DAILY_COMPLETION',
    ]);
  });

  test('does not replay gamification for an idempotent PUT retry', async () => {
    const existing = event('COMPLETED');
    source.events = [existing];
    repository.putEvent = vi.fn(async () => ({ event: existing, created: false }));
    const result = await service().put('user-1', 'UTC', source.id, today, TrackingEventKind.Completed, {});
    expect(result.meta.gamificationEvents).toEqual([]);
  });

  test('returns only a recovery event for a BREAK relapse', async () => {
    source = { ...habit('BREAK'), events: [], goals: [] };
    repository.putEvent = vi.fn(async () => ({ event: event('RELAPSED'), created: true }));
    const result = await service().put('user-1', 'UTC', source.id, today, TrackingEventKind.Relapsed, {});
    expect(result.meta.gamificationEvents).toEqual([
      expect.objectContaining({ type: 'RELAPSE_RECORDED', level: 'RECOVERY', value: 0 }),
    ]);
  });

  test('rejects an event incompatible with the habit type', async () => {
    await expect(service().put('user-1', 'UTC', source.id, today, TrackingEventKind.Relapsed, {}))
      .rejects.toMatchObject({ code: 'TRACKING_EVENT_TYPE_MISMATCH' });
  });
});
