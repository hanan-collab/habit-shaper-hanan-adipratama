import type { Goal, GoalHabit, GoalProgressDay, Habit, HabitEvent } from '@prisma/client';

export type GoalHabitModel = GoalHabit & { habit: Habit & { events: HabitEvent[] } };
export type GoalWithSourceModel = Goal & { habitLinks: GoalHabitModel[]; progressDays: GoalProgressDay[] };
export type GoalModel = Goal;

export type GoalProgressModel = { currentDays: number; remainingDays: number; percentage: number; overdue: boolean };

export function goalResponse(goal: GoalWithSourceModel, progress: GoalProgressModel, today: string) {
  const currentLinks = goal.habitLinks.filter((link) => link.connectedOn.toISOString().slice(0, 10) <= today
    && (!link.disconnectedOn || today < link.disconnectedOn.toISOString().slice(0, 10)));
  const completeToday = goal.progressDays.some((day) => day.date.toISOString().slice(0, 10) === today);
  return {
    id: goal.id, userId: goal.userId, title: goal.title, targetDays: goal.targetDays,
    deadline: goal.deadline?.toISOString().slice(0, 10) ?? null, status: goal.status,
    completedDate: goal.completedDate?.toISOString().slice(0, 10) ?? null,
    createdAt: goal.createdAt, updatedAt: goal.updatedAt,
    todayStatus: completeToday ? 'COMPLETE' as const : 'PENDING' as const,
    habits: currentLinks.map((link) => {
      const event = link.habit.events.find((item) => item.date.toISOString().slice(0, 10) === today);
      return {
        id: link.habit.id, name: link.habit.name, type: link.habit.type,
        connectedOn: link.connectedOn.toISOString().slice(0, 10),
        todayStatus: link.habit.type === 'BUILD'
          ? (event?.type === 'COMPLETED' ? 'DONE' : 'NOT_DONE')
          : (event?.type === 'RELAPSED' ? 'RELAPSED' : 'CLEAR'),
      };
    }),
    progress,
  };
}
