import type { GamificationEventModel } from '../../../gamification/gamification.model.js';
import type { GoalResponse } from '../../../goals/dto/response/goal.response.js';
import type { habitDetailResponse, habitResponse } from '../../habit.model.js';

export type HabitResponse = ReturnType<typeof habitResponse>;
export type HabitDetailResponse = ReturnType<typeof habitDetailResponse>;
export type HabitListResponse = { habits: HabitResponse[] };
export type HabitItemResponse = { habit: HabitResponse | HabitDetailResponse };
export type CreateHabitResponse = {
  habit: HabitResponse;
  createdGoals?: GoalResponse[];
  meta: { gamificationEvents: GamificationEventModel[] };
};
