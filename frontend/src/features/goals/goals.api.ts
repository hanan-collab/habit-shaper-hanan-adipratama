import { api } from '../../lib/api';
import type { Goal } from '../../types/domain';
export type GoalInput = { title: string; targetDays: number; deadline?: string | null };
export type MultiGoalInput = GoalInput & { habitIds: string[] };
export const goalsApi = {
  list: () => api<{ goals: Goal[] }>('/goals'),
  create: (habitId: string, input: GoalInput) => api<{ goal: Goal }>(`/habits/${habitId}/goals`, { method: 'POST', body: JSON.stringify(input) }),
  createMulti: (input: MultiGoalInput) => api<{ goal: Goal }>('/goals', { method: 'POST', body: JSON.stringify(input) }),
  connectHabit: (habitId: string, goalIds: string[]) => api<{ goals: Goal[] }>(`/habits/${habitId}/goal-connections`, { method: 'POST', body: JSON.stringify({ goalIds }) }),
  update: (id: string, input: Partial<MultiGoalInput>) => api<{ goal: Goal }>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  delete: (id: string) => api<void>(`/goals/${id}`, { method: 'DELETE' }),
  cancel: (id: string) => api<{ goal: Goal }>(`/goals/${id}/cancel`, { method: 'POST' }),
};
