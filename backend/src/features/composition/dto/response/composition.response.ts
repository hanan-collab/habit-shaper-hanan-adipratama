import type { GamificationEventModel } from '../../../gamification/gamification.model.js';
import type { GoalResponse } from '../../../goals/dto/response/goal.response.js';
import type { HabitResponse } from '../../../habits/dto/response/habit.response.js';

type CompositionMeta = { gamificationEvents: GamificationEventModel[] };

export type CreateHabitCompositionResponse = {
  habit: HabitResponse;
  createdGoals: GoalResponse[];
  meta: CompositionMeta;
};

export type UpdateHabitGoalsCompositionResponse = CreateHabitCompositionResponse & {
  goalIds: string[];
};

export type GoalCompositionResponse = {
  goal: GoalResponse;
  createdHabits: HabitResponse[];
  meta: CompositionMeta;
};
