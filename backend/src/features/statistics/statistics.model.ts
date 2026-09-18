import type { Habit, HabitEvent } from '@prisma/client';
import type { StatisticsPeriod } from './statistics.enum.js';

export type StatisticsSourceModel = Habit & { events: HabitEvent[] };
export type WeeklyStatisticsModel = {
  period: StatisticsPeriod;
  startDate: string;
  endDate: string;
  completedDays: number;
  missedDays: number;
  completionRate: number;
};
export type HabitStatisticsModel = {
  habitId: string;
  type: Habit['type'];
  currentStreak: number;
  longestStreak: number;
  weekly: WeeklyStatisticsModel;
  lastRelapse: string | null;
};
