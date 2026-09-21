import { HabitKind } from '../habits/habit.enum.js';
import type { HabitWithStatisticsModel, UserStatisticsModel } from './user-statistics.model.js';

export interface UserStatisticsService {
  aggregate(habits: HabitWithStatisticsModel[], totalGoalsCompleted: number): UserStatisticsModel;
}

export function createUserStatisticsService(): UserStatisticsService {
  return {
    aggregate(habits, totalGoalsCompleted) {
      const build = habits.filter((habit) => habit.type === HabitKind.Build);
      const breaking = habits.filter((habit) => habit.type === HabitKind.Break);
      const bestBuildStreak = Math.max(0, ...build.map((habit) => habit.statistics.longestStreak));
      const bestBreakStreak = Math.max(0, ...breaking.map((habit) => habit.statistics.longestStreak));
      return {
        totalBuildCompletions: build.reduce((total, habit) => total + habit.statistics.totalCompletions, 0),
        totalGoalsCompleted,
        bestBuildStreak,
        bestBreakStreak,
        bestOverallStreak: Math.max(bestBuildStreak, bestBreakStreak),
      };
    },
  };
}
