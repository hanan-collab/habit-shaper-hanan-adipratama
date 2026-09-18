import type { Goal } from '@prisma/client';
import type { StatisticsSourceModel } from '../statistics/statistics.model.js';

export type GoalModel = Goal;
export type GoalWithSourceModel = Goal & { habit: StatisticsSourceModel };
export type GoalProgressModel = {
  currentStreak: number;
  remainingDays: number;
  percentage: number;
  overdue: boolean;
};

export function goalResponse(goal: GoalModel, progress: GoalProgressModel) {
  return {
    ...goal,
    deadline: goal.deadline?.toISOString().slice(0, 10) ?? null,
    completedDate: goal.completedDate?.toISOString().slice(0, 10) ?? null,
    activeSlot: undefined,
    progress,
  };
}
