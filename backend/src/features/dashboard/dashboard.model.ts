import type { Goal, Habit, HabitEvent } from '@prisma/client';
import type { DashboardHabitStatus } from './dashboard.enum.js';
import type { HabitStatisticsModel } from '../statistics/statistics.model.js';

export type DashboardHabitSourceModel = Habit & { events: HabitEvent[]; goals: Goal[] };
export type DashboardHabitModel = {
  id: string;
  name: string;
  description: string | null;
  type: Habit['type'];
  startDate: string;
  todayStatus: DashboardHabitStatus;
  statistics: HabitStatisticsModel;
  activeGoalId: string | null;
};
export type DashboardModel = {
  date: string;
  summary: { activeHabits: number; activeGoals: number };
  habits: DashboardHabitModel[];
  goals: unknown[];
};
