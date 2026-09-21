import type { GamificationEvent, Goal, Habit, HabitStatistics } from '../../../../types/domain';

export type HabitListResponse = { habits: Habit[] };
export type HabitItemResponse = { habit: Habit };
export type HabitStatisticsResponse = { statistics: HabitStatistics };
export type HabitCompositionResponse = {
  habit: Habit;
  createdGoals?: Goal[];
  meta: { gamificationEvents: GamificationEvent[] };
};
export type TrackingActionResponse = { meta: { gamificationEvents: GamificationEvent[] } };
