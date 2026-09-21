import { api } from '../../lib/api';
import type { CreateGoalRequest, UpdateGoalRequest } from './dto/request/goal.request';
import type { GoalCompositionResponse, GoalItemResponse, GoalListResponse } from './dto/response/goal.response';
export type GoalInput = Omit<CreateGoalRequest, 'habitIds' | 'newHabits'>;
export type MultiGoalInput = CreateGoalRequest;
export const goalsApi = {
  list: () => api<GoalListResponse>('/goals'),
  create: (habitId: string, input: GoalInput) =>
    api<GoalItemResponse>(`/habits/${habitId}/goals`, { method: 'POST', body: JSON.stringify(input) }),
  createMulti: (input: MultiGoalInput) =>
    api<GoalCompositionResponse>('/goals', { method: 'POST', body: JSON.stringify(input) }),
  connectHabit: (habitId: string, goalIds: string[]) =>
    api<GoalListResponse>(`/habits/${habitId}/goal-connections`, { method: 'POST', body: JSON.stringify({ goalIds }) }),
  update: (id: string, input: UpdateGoalRequest) =>
    api<GoalCompositionResponse>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  delete: (id: string) => api<void>(`/goals/${id}`, { method: 'DELETE' }),
  cancel: (id: string) => api<GoalItemResponse>(`/goals/${id}/cancel`, { method: 'POST' }),
};
