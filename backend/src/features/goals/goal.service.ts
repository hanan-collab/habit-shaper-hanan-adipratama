import type { GoalStatus, Prisma } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import type { StatisticsService } from '../statistics/statistics.service.js';
import type { GoalGamificationState } from '../gamification/gamification.model.js';
import type { CreateGoalDto, UpdateGoalDto } from './goal.dto.js';
import { goalDate } from './goal.dto.js';
import { GoalErrorCode, GoalState } from './goal.enum.js';
import { goalResponse, type GoalModel, type GoalWithSourceModel } from './goal.model.js';
import { ActiveGoalRepositoryError, type GoalRepository } from './goal.repository.js';

export interface GoalService {
  list(userId: string, timezone: string): Promise<ReturnType<typeof goalResponse>[]>;
  create(userId: string, timezone: string, habitId: string, input: CreateGoalDto): Promise<ReturnType<typeof goalResponse>>;
  update(userId: string, timezone: string, goalId: string, input: UpdateGoalDto): Promise<ReturnType<typeof goalResponse>>;
  delete(userId: string, goalId: string): Promise<void>;
  cancel(userId: string, timezone: string, goalId: string): Promise<ReturnType<typeof goalResponse>>;
  gamificationState(goal: GoalModel, currentStreak: number): GoalGamificationState;
  syncAfterStreakChange(goal: GoalModel | null, timezone: string, currentStreak: number): Promise<GoalGamificationState | null>;
}

function todayIn(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createGoalService(repository: GoalRepository, statistics: StatisticsService): GoalService {
  const gamificationState = (goal: GoalModel, currentStreak: number): GoalGamificationState => ({
    id: goal.id,
    status: goal.status,
    currentProgress: currentStreak,
    targetStreakDays: goal.targetStreakDays,
    percentage: Math.min(100, Math.round((currentStreak / goal.targetStreakDays) * 10000) / 100),
    remainingDays: Math.max(0, goal.targetStreakDays - currentStreak),
  });
  const render = (goal: GoalModel, source: GoalWithSourceModel['habit'], timezone: string) => {
    const currentStreak = statistics.calculate(source, timezone).currentStreak;
    const remainingDays = Math.max(0, goal.targetStreakDays - currentStreak);
    const percentage = Math.min(100, Math.round((currentStreak / goal.targetStreakDays) * 10000) / 100);
    const today = todayIn(timezone);
    return goalResponse(goal, {
      currentStreak, remainingDays, percentage,
      overdue: goal.status === GoalState.Active && goal.deadline != null && goal.deadline.toISOString().slice(0, 10) < today,
    });
  };
  const synchronize = async (goal: GoalWithSourceModel, timezone: string): Promise<GoalModel> => {
    if (goal.status !== GoalState.Active) return goal;
    const currentStreak = statistics.calculate(goal.habit, timezone).currentStreak;
    if (currentStreak < goal.targetStreakDays) return goal;
    return repository.update(goal.id, {
      status: GoalState.Completed as GoalStatus,
      activeSlot: null,
      completedDate: goalDate(todayIn(timezone)),
    });
  };
  const find = async (userId: string, goalId: string) => {
    const goal = await repository.find(userId, goalId);
    if (!goal) throw new AppError(404, GoalErrorCode.NotFound, 'Goal not found');
    return goal;
  };
  const validateDeadline = (deadline: string | null | undefined, timezone: string) => {
    if (deadline && deadline < todayIn(timezone)) {
      throw new AppError(400, GoalErrorCode.InvalidDeadline, 'Goal deadline cannot be in the past');
    }
  };
  return {
    gamificationState,
    async syncAfterStreakChange(goal, timezone, currentStreak) {
      if (!goal) return null;
      if (goal.status !== GoalState.Active || currentStreak < goal.targetStreakDays) {
        return gamificationState(goal, currentStreak);
      }
      const completed = await repository.update(goal.id, {
        status: GoalState.Completed as GoalStatus,
        activeSlot: null,
        completedDate: goalDate(todayIn(timezone)),
      });
      return gamificationState(completed, currentStreak);
    },
    async list(userId, timezone) {
      const goals = await repository.list(userId);
      return Promise.all(goals.map(async (goal) => render(await synchronize(goal, timezone), goal.habit, timezone)));
    },
    async create(userId, timezone, habitId, input) {
      validateDeadline(input.deadline, timezone);
      const source = await repository.findHabit(userId, habitId);
      if (!source) throw new AppError(404, GoalErrorCode.HabitNotFound, 'Habit not found');
      const active = await repository.findActive(userId, habitId);
      if (active && (await synchronize(active, timezone)).status === GoalState.Active) {
        throw new AppError(409, GoalErrorCode.ActiveExists, 'This habit already has an active goal');
      }
      const achieved = statistics.calculate(source, timezone).currentStreak >= input.targetStreakDays;
      try {
        const goal = await repository.create({
          habitId, title: input.title, targetStreakDays: input.targetStreakDays,
          deadline: input.deadline === undefined ? undefined : input.deadline === null ? null : goalDate(input.deadline),
          status: (achieved ? GoalState.Completed : GoalState.Active) as GoalStatus,
          activeSlot: achieved ? null : 1,
          completedDate: achieved ? goalDate(todayIn(timezone)) : null,
        });
        return render(goal, source, timezone);
      } catch (error) {
        if (error instanceof ActiveGoalRepositoryError) {
          throw new AppError(409, GoalErrorCode.ActiveExists, 'This habit already has an active goal');
        }
        throw error;
      }
    },
    async update(userId, timezone, goalId, input) {
      validateDeadline(input.deadline, timezone);
      const existing = await find(userId, goalId);
      if (existing.status !== GoalState.Active && (input.targetStreakDays !== undefined || input.deadline !== undefined)) {
        throw new AppError(409, GoalErrorCode.NotActive, 'Only an active goal can change its target or deadline');
      }
      const target = input.targetStreakDays ?? existing.targetStreakDays;
      const achieved = existing.status === GoalState.Active
        && statistics.calculate(existing.habit, timezone).currentStreak >= target;
      const data: Prisma.GoalUpdateInput = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetStreakDays !== undefined ? { targetStreakDays: input.targetStreakDays } : {}),
        ...(input.deadline !== undefined ? { deadline: input.deadline === null ? null : goalDate(input.deadline) } : {}),
        ...(achieved ? {
          status: GoalState.Completed as GoalStatus, activeSlot: null, completedDate: goalDate(todayIn(timezone)),
        } : {}),
      };
      return render(await repository.update(goalId, data), existing.habit, timezone);
    },
    async delete(userId, goalId) {
      await find(userId, goalId);
      await repository.delete(goalId);
    },
    async cancel(userId, timezone, goalId) {
      const existing = await find(userId, goalId);
      if (existing.status === GoalState.Completed) {
        throw new AppError(409, GoalErrorCode.NotActive, 'A completed goal cannot be cancelled');
      }
      const goal = existing.status === GoalState.Cancelled ? existing : await repository.update(goalId, {
        status: GoalState.Cancelled as GoalStatus, activeSlot: null,
      });
      return render(goal, existing.habit, timezone);
    },
  };
}
