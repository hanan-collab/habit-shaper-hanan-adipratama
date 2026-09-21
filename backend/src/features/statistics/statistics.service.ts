import { AppError } from '../../common/app-error.js';
import { fromCalendarDate, toCalendarDate, todayInTimezone } from '../../common/calendar-date.js';
import { HabitEventKind, HabitKind } from '../habits/habit.enum.js';
import { StatisticsErrorCode, StatisticsPeriod } from './statistics.enum.js';
import type { HabitStatisticsModel, StatisticsSourceModel } from './statistics.model.js';
import type { StatisticsRepository } from './statistics.repository.js';

export interface StatisticsService {
  get(userId: string, timezone: string, habitId: string): Promise<HabitStatisticsModel>;
  all(
    userId: string,
    timezone: string,
  ): Promise<Array<{ habit: StatisticsSourceModel; statistics: HabitStatisticsModel }>>;
  calculate(source: StatisticsSourceModel, timezone: string): HabitStatisticsModel;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const key = toCalendarDate;
const date = fromCalendarDate;
const addDays = (value: string, days: number) => key(new Date(date(value).getTime() + days * DAY_MS));
const daysBetween = (from: string, to: string) => Math.round((date(to).getTime() - date(from).getTime()) / DAY_MS);

function mondayOf(dateValue: string) {
  const day = date(dateValue).getUTCDay();
  return addDays(dateValue, -(day === 0 ? 6 : day - 1));
}

function eachDate(from: string, to: string) {
  const result: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) result.push(cursor);
  return result;
}

function buildStreaks(start: string, today: string, completed: Set<string>) {
  const endpoint = completed.has(today) ? today : addDays(today, -1);
  let current = 0;
  for (let cursor = endpoint; cursor >= start && completed.has(cursor); cursor = addDays(cursor, -1)) current += 1;
  let longest = 0;
  let running = 0;
  for (const day of eachDate(start, today)) {
    running = completed.has(day) ? running + 1 : 0;
    longest = Math.max(longest, running);
  }
  return { current, longest };
}

function breakStreaks(start: string, today: string, relapses: string[]) {
  let longest = 0;
  let cursor = start;
  for (const relapse of relapses.filter((value) => value >= start && value <= today)) {
    longest = Math.max(longest, daysBetween(cursor, relapse));
    cursor = addDays(relapse, 1);
  }
  const current = cursor > today ? 0 : daysBetween(cursor, today) + 1;
  return { current, longest: Math.max(longest, current) };
}

export function createStatisticsService(
  repository: StatisticsRepository,
  now: () => Date = () => new Date(),
): StatisticsService {
  const calculate = (source: StatisticsSourceModel, timezone: string): HabitStatisticsModel => {
    const today = todayInTimezone(timezone, now());
    const start = key(source.startDate);
    const relevantEvents = source.events.filter((event) => key(event.date) >= start && key(event.date) <= today);
    const completed = new Set(
      relevantEvents.filter((event) => event.type === HabitEventKind.Completed).map((event) => key(event.date)),
    );
    const relapses = relevantEvents
      .filter((event) => event.type === HabitEventKind.Relapsed)
      .map((event) => key(event.date));
    const streaks =
      source.type === HabitKind.Build ? buildStreaks(start, today, completed) : breakStreaks(start, today, relapses);
    const weekStart = mondayOf(today);
    const eligibleStart = start > weekStart ? start : weekStart;
    const eligible = eligibleStart <= today ? eachDate(eligibleStart, today) : [];
    const missedDays =
      source.type === HabitKind.Build
        ? eligible.filter((value) => !completed.has(value)).length
        : eligible.filter((value) => relapses.includes(value)).length;
    const completedDays = eligible.length - missedDays;
    const completionRate = eligible.length === 0 ? 0 : Math.round((completedDays / eligible.length) * 10000) / 100;
    const totalCompletions =
      source.type === HabitKind.Build
        ? completed.size
        : Math.max(
            0,
            eachDate(start, today).length - relapses.filter((value) => value >= start && value <= today).length,
          );
    const lastRelapseDate = relapses.at(-1) ?? null;
    return {
      habitId: source.id,
      type: source.type,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      totalCompletions,
      completedThisWeek: completedDays,
      missedThisWeek: missedDays,
      eligibleDaysThisWeek: eligible.length,
      weeklyCompletionRate: completionRate,
      weekly: {
        period: StatisticsPeriod.CurrentWeek,
        startDate: eligible.length ? eligibleStart : today,
        endDate: today,
        completedDays,
        missedDays,
        eligibleDays: eligible.length,
        completionRate,
      },
      lastRelapse: lastRelapseDate,
      lastRelapseDate,
    };
  };
  return {
    async all(userId, timezone) {
      return (await repository.listSources(userId)).map((habit) => ({ habit, statistics: calculate(habit, timezone) }));
    },
    async get(userId, timezone, habitId) {
      const source = await repository.findSource(userId, habitId);
      if (!source) throw new AppError(404, StatisticsErrorCode.HabitNotFound, 'Habit not found');
      return calculate(source, timezone);
    },
    calculate,
  };
}
