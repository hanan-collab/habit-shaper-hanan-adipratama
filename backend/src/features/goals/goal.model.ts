import type { Goal, GoalHabit, GoalProgressDay, Habit, HabitEvent } from '@prisma/client';
import { toCalendarDate } from '../../common/calendar-date.js';

export type GoalHabitModel = GoalHabit & { habit: Habit & { events: HabitEvent[] } };
export type GoalWithSourceModel = Goal & { habitLinks: GoalHabitModel[]; progressDays: GoalProgressDay[] };
export type GoalModel = Goal;

export type GoalProgressModel = { currentDays: number; remainingDays: number; percentage: number; overdue: boolean };

export function goalResponse(goal: GoalWithSourceModel, progress: GoalProgressModel, today: string) {
  const currentLinks = goal.habitLinks.filter(
    (link) =>
      toCalendarDate(link.connectedOn) <= today &&
      (!link.disconnectedOn || today < toCalendarDate(link.disconnectedOn)),
  );
  const completeToday = goal.progressDays.some((day) => toCalendarDate(day.date) === today);
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    targetDays: goal.targetDays,
    deadline: goal.deadline ? toCalendarDate(goal.deadline) : null,
    status: goal.status,
    completedDate: goal.completedDate ? toCalendarDate(goal.completedDate) : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    todayStatus: completeToday ? ('COMPLETE' as const) : ('PENDING' as const),
    habits: currentLinks.map((link) => {
      const event = link.habit.events.find((item) => toCalendarDate(item.date) === today);
      return {
        id: link.habit.id,
        name: link.habit.name,
        type: link.habit.type,
        connectedOn: toCalendarDate(link.connectedOn),
        todayStatus:
          link.habit.type === 'BUILD'
            ? event?.type === 'COMPLETED'
              ? 'DONE'
              : 'NOT_DONE'
            : event?.type === 'RELAPSED'
              ? 'RELAPSED'
              : 'CLEAR',
      };
    }),
    progress,
  };
}
