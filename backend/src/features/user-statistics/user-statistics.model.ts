import type { HabitType } from '@prisma/client';
import type { HabitStatisticsModel } from '../statistics/statistics.model.js';

export type HabitWithStatisticsModel = {
  type: HabitType;
  statistics: HabitStatisticsModel;
};

export type UserStatisticsModel = {
  totalBuildCompletions: number;
  totalGoalsCompleted: number;
  bestBuildStreak: number;
  bestBreakStreak: number;
  bestOverallStreak: number;
};
