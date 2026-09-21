import { api } from '../../lib/api';
import type { DraftGoal } from '../../components/ui/RelationComposer';
import type { GamificationEvent, Habit, HabitStatistics, HabitType } from '../../types/domain';
export type HabitInput = { name: string; description?: string | null; type: HabitType; startDate?: string; goalIds?: string[]; newGoals?: Array<Omit<DraftGoal, 'key' | 'deadline'> & { deadline?: string | null }> };
export const habitsApi = {
  list: () => api<{ habits: Habit[] }>('/habits'), get: (id: string) => api<{ habit: Habit }>(`/habits/${id}`), statistics: (id: string) => api<{ statistics: HabitStatistics }>(`/habits/${id}/statistics`),
  create: (input: HabitInput) => api<{ habit: Habit; meta: { gamificationEvents: GamificationEvent[] } }>('/habits', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Pick<HabitInput, 'name' | 'description'>) => api<{ habit: Habit }>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  updateGoals: (id: string, input: { goalIds: string[]; newGoals: Array<Omit<DraftGoal, 'key' | 'deadline'> & { deadline?: string | null }> }) => api(`/habits/${id}/goals`, { method: 'PATCH', body: JSON.stringify(input) }),
  delete: (id: string) => api<void>(`/habits/${id}`, { method: 'DELETE' }), complete: (id: string, date: string) => api(`/habits/${id}/completions/${date}`, { method: 'PUT', body: JSON.stringify({}) }), removeCompletion: (id: string, date: string) => api<void>(`/habits/${id}/completions/${date}`, { method: 'DELETE' }), relapse: (id: string, date: string, note?: string) => api(`/habits/${id}/relapses/${date}`, { method: 'PUT', body: JSON.stringify({ note }) }), removeRelapse: (id: string, date: string) => api<void>(`/habits/${id}/relapses/${date}`, { method: 'DELETE' }),
};
