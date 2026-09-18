import { GamificationEventType } from './gamification.enum.js';

export const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
export const COMEBACK_INACTIVITY_DAYS = 3;

export const GAMIFICATION_EVENT_PRIORITY: Record<GamificationEventType, number> = {
  [GamificationEventType.GoalCompleted]: 1,
  [GamificationEventType.StreakMilestone]: 2,
  [GamificationEventType.PerfectWeek]: 3,
  [GamificationEventType.PersonalBest]: 4,
  [GamificationEventType.GoalHalfway]: 5,
  [GamificationEventType.GoalNearlyReached]: 5,
  [GamificationEventType.FirstCheckIn]: 6,
  [GamificationEventType.StreakStarted]: 7,
  [GamificationEventType.Comeback]: 8,
  [GamificationEventType.DailyCompletion]: 9,
  [GamificationEventType.HabitCreated]: 10,
  [GamificationEventType.RelapseRecorded]: 10,
};
