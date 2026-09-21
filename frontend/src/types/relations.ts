import type { HabitType } from './domain';

export type DraftGoal = { key: string; title: string; targetDays: number; deadline: string };
export type DraftHabit = { key: string; name: string; type: HabitType };
