import type { HabitType } from '@prisma/client';
import type { HabitStatisticsModel } from '../statistics/statistics.model.js';
import type { GamificationAction, GamificationEventType, GamificationLevel } from './gamification.enum.js';

export type GamificationEventModel = {
  type: GamificationEventType;
  level: GamificationLevel;
  habitId?: string;
  habitType?: HabitType;
  goalId?: string;
  value?: number;
  target?: number;
  previousValue?: number;
  daysAway?: number;
};

export type GoalGamificationState = {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentProgress: number;
  targetDays: number;
  percentage: number;
  remainingDays: number;
};

export type HabitCreatedGamificationInput = {
  action: GamificationAction.HabitCreated;
  habitId: string;
  habitType: HabitType;
};

export type BuildCompletedGamificationInput = {
  action: GamificationAction.BuildCompleted;
  eventCreated: boolean;
  habitId: string;
  before: HabitStatisticsModel;
  after: HabitStatisticsModel;
  goalBefore: GoalGamificationState | null;
  goalAfter: GoalGamificationState | null;
  localDate: string;
  daysAway?: number;
};

export type BreakRelapsedGamificationInput = {
  action: GamificationAction.BreakRelapsed;
  eventCreated: boolean;
  habitId: string;
  previousValue: number;
};

export type GamificationInput =
  | HabitCreatedGamificationInput
  | BuildCompletedGamificationInput
  | BreakRelapsedGamificationInput;
