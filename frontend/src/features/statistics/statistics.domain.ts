import type { Habit, HabitStatistics } from '../../types/domain';
export type HabitHistory = { habit: Habit; statistics: HabitStatistics };
const DAY = 86400000;
const key = (date: Date) => date.toISOString().slice(0, 10);
const add = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
export function aggregateRange(history: HabitHistory[], range: number, todayValue: string) {
  const today = new Date(`${todayValue}T00:00:00Z`);
  const days = Array.from({ length: range }, (_, index) => key(add(today, index - range + 1)));
  const series = days.map((date) => {
    let eligible = 0,
      completed = 0;
    for (const item of history) {
      if (item.habit.startDate > date) continue;
      eligible++;
      const event = item.habit.events?.find((entry) => entry.date === date);
      if (item.habit.type === 'BUILD' ? event?.type === 'COMPLETED' : event?.type !== 'RELAPSED') completed++;
    }
    return { date, eligible, completed, rate: eligible ? Math.round((completed / eligible) * 100) : 0 };
  });
  const eligible = series.reduce((sum, item) => sum + item.eligible, 0);
  const completed = series.reduce((sum, item) => sum + item.completed, 0);
  return {
    series,
    eligible,
    completed,
    missed: eligible - completed,
    rate: eligible ? Math.round((completed / eligible) * 100) : 0,
    currentStreak: Math.max(0, ...history.map((item) => item.statistics.currentStreak)),
    personalBest: Math.max(0, ...history.map((item) => item.statistics.longestStreak)),
  };
}
