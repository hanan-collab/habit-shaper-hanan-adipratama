import { HabitEventKind, HabitKind } from '../habits/habit.enum.js';
import type { GoalService } from '../goals/goal.service.js';
import { GoalState } from '../goals/goal.enum.js';
import type { StatisticsService } from '../statistics/statistics.service.js';
import { DashboardHabitStatus } from './dashboard.enum.js';
import type { DashboardModel } from './dashboard.model.js';
import type { DashboardRepository } from './dashboard.repository.js';
import type { UserStatisticsService } from '../user-statistics/user-statistics.service.js';

export interface DashboardService { get(userId: string, timezone: string): Promise<DashboardModel> }

function todayIn(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createDashboardService(
  repository: DashboardRepository,
  statisticsService: StatisticsService,
  goalService: GoalService,
  userStatisticsService: UserStatisticsService,
): DashboardService {
  return {
    async get(userId, timezone) {
      // Listing goals also synchronizes any ACTIVE goal whose streak has reached its target.
      const allGoals = await goalService.list(userId, timezone);
      const goals = allGoals.filter((goal) => goal.status === GoalState.Active);
      const sources = await repository.listHabits(userId);
      const today = todayIn(timezone);
      const habits = sources.map((habit) => {
        const todayEvent = habit.events.find((event) => event.date.toISOString().slice(0, 10) === today);
        const todayStatus = habit.type === HabitKind.Build
          ? todayEvent?.type === HabitEventKind.Completed ? DashboardHabitStatus.Completed : DashboardHabitStatus.Pending
          : todayEvent?.type === HabitEventKind.Relapsed ? DashboardHabitStatus.Relapsed : DashboardHabitStatus.Clean;
        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          type: habit.type,
          startDate: habit.startDate.toISOString().slice(0, 10),
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
