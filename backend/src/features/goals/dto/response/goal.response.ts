import type { GamificationEventModel } from '../../../gamification/gamification.model.js';
import type { goalResponse } from '../../goal.model.js';
import type { HabitResponse } from '../../../habits/dto/response/habit.response.js';

export type GoalResponse = ReturnType<typeof goalResponse>;
export type GoalListResponse = { goals: GoalResponse[] };
export type GoalItemResponse = { goal: GoalResponse };
export type GoalCompositionResponse = {
  goal: GoalResponse;
  createdHabits: HabitResponse[];
  meta: { gamificationEvents: GamificationEventModel[] };
};
