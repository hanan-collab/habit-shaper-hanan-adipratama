import type { Habit, HabitEvent } from '@prisma/client';
import { toCalendarDate } from '../../common/calendar-date.js';

export type HabitModel = Habit;
export type HabitEventModel = HabitEvent;
export type HabitDetailModel = Habit & { events: HabitEvent[] };

export function habitResponse(habit: HabitModel) {
  return {
    ...habit,
    startDate: toCalendarDate(habit.startDate),
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  };
}

export function eventResponse(event: HabitEventModel) {
  return { ...event, date: toCalendarDate(event.date), createdAt: event.createdAt.toISOString() };
}

export function habitDetailResponse(habit: HabitDetailModel) {
  return { ...habitResponse(habit), events: habit.events.map(eventResponse) };
}
