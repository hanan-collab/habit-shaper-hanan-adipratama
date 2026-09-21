import type { GoalStatus, Prisma } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import type { GoalGamificationState } from '../gamification/gamification.model.js';
import { fromCalendarDate, toCalendarDate, todayInTimezone } from '../../common/calendar-date.js';
import type { CreateGoalRequest, CreateMultiGoalRequest, UpdateGoalRequest } from './dto/request/goal.request.js';
import { GoalErrorCode, GoalState } from './goal.enum.js';
import { goalResponse, type GoalModel, type GoalWithSourceModel } from './goal.model.js';
import type { GoalRepository } from './goal.repository.js';

type Response = ReturnType<typeof goalResponse>;
export interface GoalService {
  list(userId: string, timezone: string): Promise<Response[]>;
  create(userId: string, timezone: string, habitId: string, input: CreateGoalRequest): Promise<Response>;
  createMulti(userId: string, timezone: string, input: CreateMultiGoalRequest): Promise<Response>;
  update(userId: string, timezone: string, goalId: string, input: UpdateGoalRequest): Promise<Response>;
  delete(userId: string, goalId: string): Promise<void>;
  cancel(userId: string, timezone: string, goalId: string): Promise<Response>;
  connectHabit(userId: string, timezone: string, habitId: string, goalIds: string[]): Promise<Response[]>;
  disconnectHabit(userId: string, timezone: string, habitId: string): Promise<void>;
  reconcileHabit(
    userId: string,
    timezone: string,
    habitId: string,
    date: string,
  ): Promise<{ before: GoalGamificationState; after: GoalGamificationState }[]>;
  reconcileAll(userId: string, timezone: string): Promise<void>;
  gamificationState(goal: GoalModel, progressDays: number): GoalGamificationState;
}

const key = toCalendarDate;
const datesBetween = (from: string, to: string) => {
  const dates: string[] = [];
  for (
    let cursor = fromCalendarDate(from);
    cursor <= fromCalendarDate(to);
    cursor = new Date(cursor.getTime() + 86400000)
  )
    dates.push(key(cursor));
  return dates;
};

export function createGoalService(repository: GoalRepository): GoalService {
  const progressCount = (goal: GoalWithSourceModel) => goal.finalProgressDays ?? goal.progressDays.length;
  const gamificationState = (goal: GoalModel, progressDays: number): GoalGamificationState => ({
    id: goal.id,
    status: goal.status,
    currentProgress: progressDays,
    targetDays: goal.targetDays,
    percentage: Math.min(100, Math.round((progressDays / goal.targetDays) * 10000) / 100),
    remainingDays: Math.max(0, goal.targetDays - progressDays),
  });
  const render = (goal: GoalWithSourceModel, timezone: string) => {
    const currentDays = progressCount(goal);
    const today = todayInTimezone(timezone);
    return goalResponse(
      goal,
      {
        currentDays,
        remainingDays: Math.max(0, goal.targetDays - currentDays),
        percentage: Math.min(100, Math.round((currentDays / goal.targetDays) * 10000) / 100),
        overdue: goal.status === GoalState.Active && !!goal.deadline && key(goal.deadline) < today,
      },
      today,
    );
  };
  const completeForDate = (goal: GoalWithSourceModel, date: string) => {
    const links = goal.habitLinks.filter(
      (link) => key(link.connectedOn) <= date && (!link.disconnectedOn || date < key(link.disconnectedOn)),
    );
    return (
      links.length > 0 &&
      links.every((link) => {
        const event = link.habit.events.find((item) => key(item.date) === date);
        return link.habit.type === 'BUILD' ? event?.type === 'COMPLETED' : event?.type !== 'RELAPSED';
      })
    );
  };
  const project = (goal: GoalWithSourceModel, timezone: string): GoalWithSourceModel => {
    if (goal.status !== GoalState.Active) return goal;
    const today = todayInTimezone(timezone);
    const first = goal.habitLinks.map((link) => key(link.connectedOn)).sort()[0] ?? today;
    const progressDays = datesBetween(first, today)
      .filter((date) => completeForDate(goal, date))
      .map((date) => ({
        id: `projection:${goal.id}:${date}`,
        goalId: goal.id,
        date: fromCalendarDate(date),
        createdAt: fromCalendarDate(date),
      }));
    if (progressDays.length < goal.targetDays) return { ...goal, progressDays };
    return {
      ...goal,
      status: GoalState.Completed as GoalStatus,
      completedDate: fromCalendarDate(today),
      finalProgressDays: progressDays.length,
      progressDays,
    };
  };
  const reconcile = async (goal: GoalWithSourceModel, timezone: string, onlyDate?: string) => {
    if (goal.status !== GoalState.Active) return goal;
    const today = todayInTimezone(timezone);
    const first = goal.habitLinks.map((link) => key(link.connectedOn)).sort()[0] ?? today;
    const dates = onlyDate ? [onlyDate] : datesBetween(first, today);
    for (const date of dates)
      await repository.setProgressDay(goal.id, fromCalendarDate(date), completeForDate(goal, date));
    await repository.update(goal.id, { lastEvaluatedDate: fromCalendarDate(today) });
    let fresh = (await repository.find(goal.userId, goal.id)) as GoalWithSourceModel;
    if (fresh.progressDays.length >= fresh.targetDays) {
      await repository.update(goal.id, {
        status: GoalState.Completed as GoalStatus,
        completedDate: fromCalendarDate(today),
        finalProgressDays: fresh.progressDays.length,
      });
      fresh = (await repository.find(goal.userId, goal.id)) as GoalWithSourceModel;
    }
    return fresh;
  };
  const find = async (userId: string, goalId: string) => {
    const goal = await repository.find(userId, goalId);
    if (!goal) throw new AppError(404, GoalErrorCode.NotFound, 'Goal not found');
    return goal;
  };
  const validateDeadline = (deadline: string | null | undefined, timezone: string) => {
    if (deadline && deadline < todayInTimezone(timezone))
      throw new AppError(400, GoalErrorCode.InvalidDeadline, 'Goal deadline cannot be in the past');
  };
  const validateHabits = async (userId: string, habitIds: string[]) => {
    const unique = [...new Set(habitIds)];
    const habits = await repository.findHabits(userId, unique);
    if (habits.length !== unique.length)
      throw new AppError(404, GoalErrorCode.HabitNotFound, 'One or more habits were not found');
    return unique;
  };
  const createMulti = async (userId: string, timezone: string, input: CreateMultiGoalRequest) => {
    validateDeadline(input.deadline, timezone);
    const habitIds = await validateHabits(userId, input.habitIds);
    const today = todayInTimezone(timezone);
    const created = await repository.create({
      userId,
      title: input.title,
      targetDays: input.targetDays,
      deadline:
        input.deadline === undefined ? undefined : input.deadline === null ? null : fromCalendarDate(input.deadline),
      habitIds,
      connectedOn: fromCalendarDate(today),
    });
    return render(await reconcile(created, timezone, today), timezone);
  };
  return {
    gamificationState,
    async list(userId, timezone) {
      const goals = await repository.list(userId);
      return goals.map((goal) => render(project(goal, timezone), timezone));
    },
    create: (userId, timezone, habitId, input) => createMulti(userId, timezone, { ...input, habitIds: [habitId] }),
    createMulti,
    async update(userId, timezone, goalId, input) {
      validateDeadline(input.deadline, timezone);
      const existing = await find(userId, goalId);
      if (
        existing.status !== GoalState.Active &&
        (input.targetDays !== undefined || input.deadline !== undefined || input.habitIds !== undefined)
      ) {
        throw new AppError(
          409,
          GoalErrorCode.NotActive,
          'Only an active goal can change its target, deadline, or habits',
        );
      }
      if (input.habitIds) await validateHabits(userId, input.habitIds);
      const data: Prisma.GoalUpdateInput = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetDays !== undefined ? { targetDays: input.targetDays } : {}),
        ...(input.deadline !== undefined
          ? { deadline: input.deadline === null ? null : fromCalendarDate(input.deadline) }
          : {}),
      };
      await repository.update(goalId, data);
      if (input.habitIds)
        await repository.replaceLinks(goalId, input.habitIds, fromCalendarDate(todayInTimezone(timezone)));
      return render(await reconcile(await find(userId, goalId), timezone), timezone);
    },
    async delete(userId, goalId) {
      await find(userId, goalId);
      await repository.delete(goalId);
    },
    async cancel(userId, timezone, goalId) {
      const existing = await find(userId, goalId);
      if (existing.status === GoalState.Completed)
        throw new AppError(409, GoalErrorCode.NotActive, 'A completed goal cannot be cancelled');
      if (existing.status !== GoalState.Cancelled)
        await repository.update(goalId, {
          status: GoalState.Cancelled as GoalStatus,
          finalProgressDays: existing.progressDays.length,
        });
      return render(await find(userId, goalId), timezone);
    },
    async connectHabit(userId, timezone, habitId, goalIds) {
      await validateHabits(userId, [habitId]);
      const unique = [...new Set(goalIds)];
      const selected = await Promise.all(unique.map((id) => find(userId, id)));
      if (selected.some((goal) => goal.status !== GoalState.Active))
        throw new AppError(409, GoalErrorCode.NotActive, 'Habits can only connect to active goals');
      const today = todayInTimezone(timezone);
      await repository.connect(habitId, unique, fromCalendarDate(today));
      return Promise.all(
        unique.map(async (id) => render(await reconcile(await find(userId, id), timezone, today), timezone)),
      );
    },
    async disconnectHabit(userId, timezone, habitId) {
      const goals = await repository.findActiveByHabit(userId, habitId);
      const today = todayInTimezone(timezone);
      await repository.disconnectHabit(userId, habitId, fromCalendarDate(today));
      for (const goal of goals) {
        const fresh = await find(userId, goal.id);
        const activeLinks = fresh.habitLinks.filter((link) => !link.disconnectedOn);
        if (!activeLinks.length)
          await repository.update(goal.id, {
            status: GoalState.Cancelled as GoalStatus,
            finalProgressDays: fresh.progressDays.length,
          });
        else await reconcile(fresh, timezone, today);
      }
    },
    async reconcileHabit(userId, timezone, habitId, date) {
      const goals = await repository.findActiveByHabit(userId, habitId);
      const transitions = [];
      for (const goal of goals) {
        const before = gamificationState(goal, progressCount(goal));
        const updated = await reconcile(goal, timezone, date);
        transitions.push({ before, after: gamificationState(updated, progressCount(updated)) });
      }
      return transitions;
    },
    async reconcileAll(userId, timezone) {
      const goals = await repository.list(userId);
      for (const goal of goals) await reconcile(goal, timezone);
    },
  };
}
