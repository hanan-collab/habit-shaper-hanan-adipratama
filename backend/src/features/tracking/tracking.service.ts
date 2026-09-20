import type { HabitEventType } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import { GamificationAction } from '../gamification/gamification.enum.js';
import type { GamificationService } from '../gamification/gamification.service.js';
import type { GoalService } from '../goals/goal.service.js';
import { HabitKind } from '../habits/habit.enum.js';
import type { StatisticsService } from '../statistics/statistics.service.js';
import type { TrackingEventDto } from './tracking.dto.js';
import { trackingDate } from './tracking.dto.js';
import { TrackingErrorCode, TrackingEventKind } from './tracking.enum.js';
import { trackingEventResponse, type TrackingActionModel } from './tracking.model.js';
import type { TrackingRepository } from './tracking.repository.js';

export interface TrackingService {
  put(userId: string, timezone: string, habitId: string, date: string, kind: TrackingEventKind, input: TrackingEventDto): Promise<TrackingActionModel>;
  delete(userId: string, timezone: string, habitId: string, date: string, kind: TrackingEventKind): Promise<void>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((trackingDate(to).getTime() - trackingDate(from).getTime()) / DAY_MS);
const expectedKind = (event: TrackingEventKind) => event === TrackingEventKind.Completed ? HabitKind.Build : HabitKind.Break;

function todayIn(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createTrackingService(
  repository: TrackingRepository,
  statistics: StatisticsService,
  goals: GoalService,
  gamification: GamificationService,
): TrackingService {
  const find = async (userId: string, habitId: string) => {
    const source = await repository.findSource(userId, habitId);
    if (!source) throw new AppError(404, TrackingErrorCode.HabitNotFound, 'Habit not found');
    return source;
  };
  const validate = (source: Awaited<ReturnType<typeof find>>, timezone: string, date: string, kind: TrackingEventKind) => {
    if (source.type !== expectedKind(kind)) {
      throw new AppError(409, TrackingErrorCode.WrongEventType, `${source.type} habits do not accept ${kind} events`);
    }
    const start = dateKey(source.startDate);
    if (date < start || date > todayIn(timezone)) {
      throw new AppError(400, TrackingErrorCode.InvalidEventDate, 'Event date must be between the habit start date and today');
    }
  };
  return {
    async put(userId, timezone, habitId, date, kind, input) {
      const source = await find(userId, habitId);
      validate(source, timezone, date, kind);
      const before = statistics.calculate(source, timezone);
      const goalBefore = null;
      const previousCompletion = kind === TrackingEventKind.Completed
        ? source.events.filter((item) => item.type === TrackingEventKind.Completed && dateKey(item.date) < date).at(-1)
        : undefined;
      const result = await repository.putEvent({
        habitId, type: kind as HabitEventType, date: trackingDate(date), note: input.note,
      });
      if (!result.created) {
        return {
          data: { event: trackingEventResponse(result.event), stats: before, goal: goalBefore },
          meta: { gamificationEvents: [] },
        };
      }
      const afterSource = { ...source, events: [...source.events, result.event].sort((left, right) => left.date.getTime() - right.date.getTime()) };
      const after = statistics.calculate(afterSource, timezone);
      const goalTransitions = await goals.reconcileHabit(userId, timezone, habitId, date);
      const goalAfter = goalTransitions[0]?.after ?? null;
      const primaryGoalBefore = goalTransitions[0]?.before ?? null;
      const action = kind === TrackingEventKind.Completed
        ? {
            action: GamificationAction.BuildCompleted as const,
            eventCreated: true,
            habitId,
            before,
            after,
            goalBefore: primaryGoalBefore,
            goalAfter,
            localDate: date,
            ...(previousCompletion ? { daysAway: Math.max(0, daysBetween(dateKey(previousCompletion.date), date) - 1) } : {}),
          }
        : {
            action: GamificationAction.BreakRelapsed as const,
            eventCreated: true,
            habitId,
            previousValue: before.currentStreak,
          };
      const additionalGoalEvents = kind === TrackingEventKind.Completed ? goalTransitions.slice(1).flatMap((transition) => gamification.evaluate({
        action: GamificationAction.BuildCompleted, eventCreated: true, habitId, before, after,
        goalBefore: transition.before, goalAfter: transition.after, localDate: date,
        ...(previousCompletion ? { daysAway: Math.max(0, daysBetween(dateKey(previousCompletion.date), date) - 1) } : {}),
      }).filter((item) => item.goalId === transition.after.id)) : [];
      return {
        data: { event: trackingEventResponse(result.event), stats: after, goal: goalAfter },
        meta: { gamificationEvents: [
          ...gamification.evaluate(action),
          ...additionalGoalEvents,
        ] },
      };
    },
    async delete(userId, timezone, habitId, date, kind) {
      const source = await find(userId, habitId);
      validate(source, timezone, date, kind);
      await repository.deleteEvent(habitId, trackingDate(date), kind as HabitEventType);
      await goals.reconcileHabit(userId, timezone, habitId, date);
    },
  };
}
