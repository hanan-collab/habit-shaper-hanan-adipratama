import {
  COMEBACK_INACTIVITY_DAYS,
  GAMIFICATION_EVENT_PRIORITY,
  STREAK_MILESTONES,
} from './gamification.config.js';
import { GamificationAction, GamificationEventType, GamificationLevel } from './gamification.enum.js';
import type { BuildCompletedGamificationInput, GamificationEventModel, GamificationInput } from './gamification.model.js';

export interface GamificationService {
  evaluate(input: GamificationInput): GamificationEventModel[];
}

const event = (
  type: GamificationEventType,
  level: GamificationLevel,
  context: Omit<GamificationEventModel, 'type' | 'level'>,
): GamificationEventModel => ({ type, level, ...context });

function isSunday(localDate: string) {
  return new Date(`${localDate}T00:00:00.000Z`).getUTCDay() === 0;
}

function evaluateBuild(input: BuildCompletedGamificationInput) {
  if (!input.eventCreated) return [];
  const events: GamificationEventModel[] = [];
  const habit = { habitId: input.habitId };

  if (input.before.totalCompletions === 0) {
    events.push(event(GamificationEventType.FirstCheckIn, GamificationLevel.Progress, { ...habit, value: 1 }));
  }
  events.push(event(GamificationEventType.DailyCompletion, GamificationLevel.Micro, {
    ...habit, value: input.after.currentStreak,
  }));
  if (input.before.currentStreak === 0 && input.after.currentStreak === 1) {
    events.push(event(GamificationEventType.StreakStarted, GamificationLevel.Progress, { ...habit, value: 1 }));
  }
  if (STREAK_MILESTONES.has(input.after.currentStreak)) {
    events.push(event(GamificationEventType.StreakMilestone, GamificationLevel.Milestone, {
      ...habit, value: input.after.currentStreak,
    }));
  }
  if (input.after.currentStreak > input.before.longestStreak) {
    events.push(event(GamificationEventType.PersonalBest, GamificationLevel.Progress, {
      ...habit, value: input.after.currentStreak, previousValue: input.before.longestStreak,
    }));
  }
  if (input.goalBefore && input.goalAfter) {
    const goal = {
      goalId: input.goalAfter.id,
      value: input.goalAfter.currentProgress,
      target: input.goalAfter.targetDays,
    };
    if (input.goalBefore.percentage < 50 && input.goalAfter.percentage >= 50) {
      events.push(event(GamificationEventType.GoalHalfway, GamificationLevel.Progress, goal));
    }
    if (input.goalBefore.remainingDays > 1 && input.goalAfter.remainingDays === 1) {
      events.push(event(GamificationEventType.GoalNearlyReached, GamificationLevel.Progress, goal));
    }
    if (input.goalBefore.status === 'ACTIVE' && input.goalAfter.status === 'COMPLETED') {
      events.push(event(GamificationEventType.GoalCompleted, GamificationLevel.Milestone, {
        goalId: input.goalAfter.id, target: input.goalAfter.targetDays,
      }));
    }
  }
  if (isSunday(input.localDate)
    && input.after.eligibleDaysThisWeek === 7
    && input.after.completedThisWeek === 7) {
    events.push(event(GamificationEventType.PerfectWeek, GamificationLevel.Milestone, { ...habit, value: 7 }));
  }
  if (input.daysAway !== undefined && input.daysAway >= COMEBACK_INACTIVITY_DAYS) {
    events.push(event(GamificationEventType.Comeback, GamificationLevel.Progress, {
      ...habit, daysAway: input.daysAway,
    }));
  }
  return events.sort((left, right) => GAMIFICATION_EVENT_PRIORITY[left.type] - GAMIFICATION_EVENT_PRIORITY[right.type]);
}

export function createGamificationService(): GamificationService {
  return {
    evaluate(input) {
      if (input.action === GamificationAction.HabitCreated) {
        return [event(GamificationEventType.HabitCreated, GamificationLevel.Progress, {
          habitId: input.habitId, habitType: input.habitType,
        })];
      }
      if (input.action === GamificationAction.BreakRelapsed) {
        if (!input.eventCreated) return [];
        return [event(GamificationEventType.RelapseRecorded, GamificationLevel.Recovery, {
          habitId: input.habitId, previousValue: input.previousValue, value: 0,
        })];
      }
      return evaluateBuild(input);
    },
  };
}
