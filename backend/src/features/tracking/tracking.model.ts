import type { Habit, HabitEvent } from '@prisma/client';
import type { GamificationMetaDto } from '../gamification/gamification.dto.js';
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
  meta: GamificationMetaDto;
};

export const trackingEventResponse = (event: HabitEvent) => ({
  ...event,
  date: event.date.toISOString().slice(0, 10),
});
