import { api } from '../../lib/api';
import type { CreateHabitRequest, UpdateHabitGoalsRequest, UpdateHabitRequest } from './dto/request/habit.request';
import type {
  HabitCompositionResponse,
  HabitItemResponse,
  HabitListResponse,
  HabitStatisticsResponse,
  TrackingActionResponse,
} from './dto/response/habit.response';
export const habitsApi = {
  list: () => api<HabitListResponse>('/habits'),
  get: (id: string) => api<HabitItemResponse>(`/habits/${id}`),
  statistics: (id: string) => api<HabitStatisticsResponse>(`/habits/${id}/statistics`),
  create: (input: CreateHabitRequest) =>
    api<HabitCompositionResponse>('/habits', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateHabitRequest) =>
    api<HabitItemResponse>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  updateGoals: (id: string, input: UpdateHabitGoalsRequest) =>
    api<HabitCompositionResponse>(`/habits/${id}/goals`, { method: 'PATCH', body: JSON.stringify(input) }),
  delete: (id: string) => api<void>(`/habits/${id}`, { method: 'DELETE' }),
  complete: (id: string, date: string) =>
    api<TrackingActionResponse>(`/habits/${id}/completions/${date}`, { method: 'PUT', body: JSON.stringify({}) }),
  removeCompletion: (id: string, date: string) => api<void>(`/habits/${id}/completions/${date}`, { method: 'DELETE' }),
  relapse: (id: string, date: string, note?: string) =>
    api<TrackingActionResponse>(`/habits/${id}/relapses/${date}`, { method: 'PUT', body: JSON.stringify({ note }) }),
  removeRelapse: (id: string, date: string) => api<void>(`/habits/${id}/relapses/${date}`, { method: 'DELETE' }),
};
