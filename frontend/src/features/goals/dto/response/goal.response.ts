import type { GamificationEvent, Goal, Habit } from '../../../../types/domain';

export type GoalListResponse = { goals: Goal[] };
export type GoalItemResponse = { goal: Goal };
export type GoalCompositionResponse = {
  goal: Goal;
  createdHabits?: Habit[];
  meta?: { gamificationEvents: GamificationEvent[] };
};
