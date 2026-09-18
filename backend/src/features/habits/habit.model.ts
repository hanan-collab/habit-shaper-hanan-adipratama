import type { Habit, HabitEvent } from '@prisma/client';

export type HabitModel = Habit;
export type HabitEventModel = HabitEvent;
export type HabitDetailModel = Habit & { events: HabitEvent[] };

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export function habitResponse(habit: HabitModel) {
  return { ...habit, startDate: dateOnly(habit.startDate) };
}

export function eventResponse(event: HabitEventModel) {
  return { ...event, date: dateOnly(event.date) };
}

export function habitDetailResponse(habit: HabitDetailModel) {
  return { ...habitResponse(habit), events: habit.events.map(eventResponse) };
}
