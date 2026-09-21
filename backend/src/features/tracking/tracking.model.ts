import type { Habit, HabitEvent } from '@prisma/client';
import { toCalendarDate } from '../../common/calendar-date.js';
import type { GamificationMetaResponse } from '../gamification/dto/response/gamification.response.js';
import type { GoalGamificationState } from '../gamification/gamification.model.js';
import type { HabitStatisticsModel } from '../statistics/statistics.model.js';

export type TrackingSourceModel = Habit & { events: HabitEvent[] };
export type PutTrackingEventModel = { event: HabitEvent; created: boolean };

export type TrackingActionModel = {
  data: {
    event: ReturnType<typeof trackingEventResponse>;
    stats: HabitStatisticsModel;
    goal: GoalGamificationState | null;
  };
  meta: GamificationMetaResponse;
};

export const trackingEventResponse = (event: HabitEvent) => ({
  ...event,
  date: toCalendarDate(event.date),
  createdAt: event.createdAt.toISOString(),
});
