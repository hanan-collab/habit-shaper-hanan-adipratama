import { HabitEventKind, HabitKind } from '../habits/habit.enum.js';
import type { GoalService } from '../goals/goal.service.js';
import { GoalState } from '../goals/goal.enum.js';
import type { StatisticsService } from '../statistics/statistics.service.js';
import { DashboardHabitStatus } from './dashboard.enum.js';
import type { DashboardModel } from './dashboard.model.js';
import type { DashboardRepository } from './dashboard.repository.js';
import type { UserStatisticsService } from '../user-statistics/user-statistics.service.js';

export interface DashboardService {
  get(userId: string, timezone: string): Promise<DashboardModel>;
}

export function createDashboardService(
  repository: DashboardRepository,
  statisticsService: StatisticsService,
  goalService: GoalService,
  userStatisticsService: UserStatisticsService,
): DashboardService {
  return {
    async get(userId, timezone) {
      // Goal listing returns a read-only projection for the current local day.
      const allGoals = await goalService.list(userId, timezone);
      const goals = allGoals.filter((goal) => goal.status === GoalState.Active);
      const sources = await repository.listHabits(userId);
      const today = todayInTimezone(timezone);
      const habits = sources.map((habit) => {
        const todayEvent = habit.events.find((event) => toCalendarDate(event.date) === today);
        const todayStatus =
          habit.type === HabitKind.Build
            ? todayEvent?.type === HabitEventKind.Completed
              ? DashboardHabitStatus.Completed
              : DashboardHabitStatus.Pending
            : todayEvent?.type === HabitEventKind.Relapsed
              ? DashboardHabitStatus.Relapsed
              : DashboardHabitStatus.Clean;
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          type: habit.type,
          startDate: toCalendarDate(habit.startDate),
          todayStatus,
          statistics: statisticsService.calculate(habit, timezone),
          activeGoalId: goals.find((goal) => goal.habits.some((item) => item.id === habit.id))?.id ?? null,
        };
      });
      return {
        date: today,
        summary: { activeHabits: habits.length, activeGoals: goals.length },
        habits,
        goals,
        userStatistics: userStatisticsService.aggregate(
          habits.map((habit) => ({ type: habit.type, statistics: habit.statistics })),
          allGoals.filter((goal) => goal.status === GoalState.Completed).length,
        ),
      };
    },
  };
}
import { toCalendarDate, todayInTimezone } from '../../common/calendar-date.js';
