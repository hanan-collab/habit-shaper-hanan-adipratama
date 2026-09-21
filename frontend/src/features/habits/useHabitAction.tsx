import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDate } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { DashboardHabit, GamificationEvent } from '../../types/domain';
import { useToast } from '../../components/ui/ToastProvider';
import { useSession } from '../auth/auth.queries';
import { dashboardKey } from '../dashboard/dashboard.keys';
import { habitsApi } from './habits.api';
import { RelapseDialog } from './RelapseDialog';

type Action = { id: string; action: 'complete' | 'undo' | 'relapse' | 'undo-relapse'; note?: string };

export function useHabitAction(habits: DashboardHabit[], onEvents?: (events: GamificationEvent[]) => void) {
  const cache = useQueryClient();
  const session = useSession();
  const { pushToast } = useToast();
  const [relapseId, setRelapseId] = useState<string | null>(null);
  const [burstId, setBurstId] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (input: Action) => {
      const date = localDate(session.data?.user.timezone);
      if (input.action === 'undo') return habitsApi.removeCompletion(input.id, date);
      if (input.action === 'undo-relapse') return habitsApi.removeRelapse(input.id, date);
      if (input.action === 'relapse') return habitsApi.relapse(input.id, date, input.note);
      return habitsApi.complete(input.id, date);
    },
    onSuccess: async (result, input) => {
      if (result && 'meta' in result) {
        onEvents?.(result.meta.gamificationEvents);
        if (input.action === 'complete') {
          setBurstId(input.id);
          window.setTimeout(() => setBurstId((current) => (current === input.id ? null : current)), 900);
        }
      }
      setRelapseId(null);
      await Promise.all([
        cache.invalidateQueries({ queryKey: dashboardKey }),
        cache.invalidateQueries({ queryKey: queryKeys.habits.detail(input.id) }),
        cache.invalidateQueries({ queryKey: queryKeys.habits.statistics(input.id) }),
        cache.invalidateQueries({ queryKey: queryKeys.goals.all }),
        cache.invalidateQueries({ queryKey: queryKeys.statistics.summary }),
        cache.invalidateQueries({ queryKey: queryKeys.statistics.all }),
      ]);
    },
    onError: () =>
      pushToast({
        variant: 'error',
        title: "Couldn't save action",
        message: 'Your progress has not changed. Try again.',
      }),
  });

  const act = (habit: DashboardHabit) => {
    if (habit.type === 'BUILD')
      mutation.mutate({ id: habit.id, action: habit.todayStatus === 'COMPLETED' ? 'undo' : 'complete' });
    else if (habit.todayStatus === 'RELAPSED') mutation.mutate({ id: habit.id, action: 'undo-relapse' });
    else setRelapseId(habit.id);
  };
  const relapseHabit = habits.find((habit) => habit.id === relapseId);
  const dialog = relapseHabit ? (
    <RelapseDialog
      habitName={relapseHabit.name}
      pending={mutation.isPending}
      onClose={() => setRelapseId(null)}
      onConfirm={(note) => mutation.mutate({ id: relapseHabit.id, action: 'relapse', note })}
    />
  ) : null;
  return { act, dialog, burstId, pendingId: mutation.isPending ? (mutation.variables?.id ?? null) : null };
}
