import type { GoalStatus, HabitType } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import { fromCalendarDate, todayInTimezone } from '../../common/calendar-date.js';
import { GamificationAction } from '../gamification/gamification.enum.js';
import type { GamificationService } from '../gamification/gamification.service.js';
import type { CreateMultiGoalRequest, UpdateGoalRequest } from '../goals/dto/request/goal.request.js';
import { GoalErrorCode, GoalState } from '../goals/goal.enum.js';
import { createGoalRepository } from '../goals/goal.repository.js';
import { createGoalService } from '../goals/goal.service.js';
import { habitResponse } from '../habits/habit.model.js';
import type { CreateHabitRequest, UpdateHabitGoalsRequest } from '../habits/dto/request/habit.request.js';
import { HabitErrorCode } from '../habits/habit.enum.js';
import type {
  CreateHabitCompositionResponse,
  GoalCompositionResponse,
  UpdateHabitGoalsCompositionResponse,
} from './dto/response/composition.response.js';
import type { TransactionContext, UnitOfWork } from '../../lib/unit-of-work.js';
const normalize = (value: string) => value.trim().toLocaleLowerCase();

export interface CompositionService {
  createHabit(userId: string, timezone: string, input: CreateHabitRequest): Promise<CreateHabitCompositionResponse>;
  updateHabitGoals(
    userId: string,
    timezone: string,
    habitId: string,
    input: UpdateHabitGoalsRequest,
  ): Promise<UpdateHabitGoalsCompositionResponse>;
  createGoal(userId: string, timezone: string, input: CreateMultiGoalRequest): Promise<GoalCompositionResponse>;
  updateGoal(
    userId: string,
    timezone: string,
    goalId: string,
    input: UpdateGoalRequest,
  ): Promise<GoalCompositionResponse>;
  deleteHabit(userId: string, timezone: string, habitId: string): Promise<void>;
}

export function createCompositionService(
  unitOfWork: UnitOfWork,
  gamification: GamificationService,
): CompositionService {
  const validateDeadline = (deadline: string | null | undefined, today: string) => {
    if (deadline && deadline < today)
      throw new AppError(400, GoalErrorCode.InvalidDeadline, 'Goal deadline cannot be in the past');
  };
  const validateNames = (values: string[]) => {
    if (new Set(values.map(normalize)).size !== values.length)
      throw new AppError(400, 'DUPLICATE_DRAFT', 'Already added.');
  };
  const activeGoals = async (tx: TransactionContext, userId: string, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) throw new AppError(400, 'DUPLICATE_RELATION', 'Already added.');
    const goals = await tx.goal.findMany({ where: { userId, id: { in: unique } } });
    if (goals.length !== unique.length)
      throw new AppError(404, GoalErrorCode.NotFound, 'One or more goals were not found');
    if (goals.some((goal) => goal.status !== GoalState.Active))
      throw new AppError(409, GoalErrorCode.NotActive, 'Habits can only connect to active goals');
    return unique;
  };
  const ownedHabits = async (tx: TransactionContext, userId: string, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) throw new AppError(400, 'DUPLICATE_RELATION', 'Already added.');
    const habits = await tx.habit.findMany({ where: { userId, id: { in: unique } }, select: { id: true } });
    if (habits.length !== unique.length)
      throw new AppError(404, GoalErrorCode.HabitNotFound, 'One or more habits were not found');
    return unique;
  };
  const createDraftHabits = async (
    tx: TransactionContext,
    userId: string,
    today: string,
    drafts: NonNullable<CreateMultiGoalRequest['newHabits']>,
  ) => {
    validateNames(drafts.map((draft) => draft.name));
    const created = [];
    for (const draft of drafts)
      created.push(
        await tx.habit.create({
          data: {
            userId,
            name: draft.name,
            description: null,
            type: draft.type as HabitType,
            startDate: fromCalendarDate(today),
          },
        }),
      );
    return created;
  };
  const createDraftGoals = async (
    tx: TransactionContext,
    userId: string,
    timezone: string,
    today: string,
    habitId: string,
    drafts: NonNullable<CreateHabitRequest['newGoals']>,
  ) => {
    validateNames(drafts.map((draft) => draft.title));
    const service = createGoalService(createGoalRepository(tx));
    const created = [];
    for (const draft of drafts) {
      validateDeadline(draft.deadline, today);
      created.push(await service.createMulti(userId, timezone, { ...draft, habitIds: [habitId], newHabits: [] }));
    }
    return created;
  };
  return {
    createHabit(userId, timezone, input) {
      return unitOfWork.run(async (tx) => {
        const today = todayInTimezone(timezone);
        const goalIds = await activeGoals(tx, userId, input.goalIds ?? []);
        const habit = await tx.habit.create({
          data: {
            userId,
            name: input.name,
            description: input.description,
            type: input.type as HabitType,
            startDate: fromCalendarDate(today),
          },
        });
        if (goalIds.length)
          await tx.goalHabit.createMany({
            data: goalIds.map((goalId) => ({ goalId, habitId: habit.id, connectedOn: fromCalendarDate(today) })),
          });
        const goalService = createGoalService(createGoalRepository(tx));
        for (const goalId of goalIds)
          await goalService.update(userId, timezone, goalId, {
            habitIds: (
              await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })
            ).map((item) => item.habitId),
          });
        const createdGoals = await createDraftGoals(tx, userId, timezone, today, habit.id, input.newGoals ?? []);
        return {
          habit: habitResponse(habit),
          createdGoals,
          meta: {
            gamificationEvents: gamification.evaluate({
              action: GamificationAction.HabitCreated,
              habitId: habit.id,
              habitType: habit.type,
            }),
          },
        };
      });
    },
    updateHabitGoals(userId, timezone, habitId, input) {
      return unitOfWork.run(async (tx) => {
        const habit = await tx.habit.findFirst({ where: { id: habitId, userId } });
        if (!habit) throw new AppError(404, HabitErrorCode.NotFound, 'Habit not found');
        const today = todayInTimezone(timezone);
        const date = fromCalendarDate(today);
        const goalIds = await activeGoals(tx, userId, input.goalIds);
        const current = await tx.goalHabit.findMany({
          where: { habitId, disconnectedOn: null, goal: { userId, status: GoalState.Active } },
        });
        const desired = new Set(goalIds);
        const currentIds = new Set(current.map((link) => link.goalId));
        const removed = current.filter((link) => !desired.has(link.goalId));
        if (removed.length)
          await tx.goalHabit.updateMany({
            where: { id: { in: removed.map((link) => link.id) } },
            data: { disconnectedOn: date },
          });
        const additions = goalIds.filter((id) => !currentIds.has(id));
        if (additions.length)
          await tx.goalHabit.createMany({ data: additions.map((goalId) => ({ goalId, habitId, connectedOn: date })) });
        const createdGoals = await createDraftGoals(tx, userId, timezone, today, habitId, input.newGoals);
        const goalService = createGoalService(createGoalRepository(tx));
        for (const link of removed) {
          const remaining = await tx.goalHabit.count({ where: { goalId: link.goalId, disconnectedOn: null } });
          if (!remaining)
            await tx.goal.update({
              where: { id: link.goalId },
              data: {
                status: GoalState.Cancelled as GoalStatus,
                finalProgressDays: await tx.goalProgressDay.count({ where: { goalId: link.goalId } }),
              },
            });
          else
            await goalService.update(userId, timezone, link.goalId, {
              habitIds: (
                await tx.goalHabit.findMany({
                  where: { goalId: link.goalId, disconnectedOn: null },
                  select: { habitId: true },
                })
              ).map((item) => item.habitId),
            });
        }
        for (const goalId of additions)
          await goalService.update(userId, timezone, goalId, {
            habitIds: (
              await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })
            ).map((item) => item.habitId),
          });
        return {
          habit: habitResponse(habit),
          createdGoals,
          goalIds: [...goalIds, ...createdGoals.map((goal) => goal.id)],
          meta: { gamificationEvents: [] },
        };
      });
    },
    createGoal(userId, timezone, input) {
      return unitOfWork.run(async (tx) => {
        const today = todayInTimezone(timezone);
        validateDeadline(input.deadline, today);
        const ids = await ownedHabits(tx, userId, input.habitIds);
        const createdHabits = await createDraftHabits(tx, userId, today, input.newHabits ?? []);
        const allIds = [...ids, ...createdHabits.map((habit) => habit.id)];
        if (!allIds.length) throw new AppError(400, GoalErrorCode.HabitNotFound, 'Choose at least one habit');
        const goal = await createGoalService(createGoalRepository(tx)).createMulti(userId, timezone, {
          ...input,
          habitIds: allIds,
          newHabits: [],
        });
        return {
          goal,
          createdHabits: createdHabits.map(habitResponse),
          meta: {
            gamificationEvents: createdHabits.flatMap((habit) =>
              gamification.evaluate({
                action: GamificationAction.HabitCreated,
                habitId: habit.id,
                habitType: habit.type,
              }),
            ),
          },
        };
      });
    },
    updateGoal(userId, timezone, goalId, input) {
      return unitOfWork.run(async (tx) => {
        const existing = await tx.goal.findFirst({ where: { id: goalId, userId } });
        if (!existing) throw new AppError(404, GoalErrorCode.NotFound, 'Goal not found');
        if (existing.status !== GoalState.Active) {
          if (Object.keys(input).some((key) => key !== 'title'))
            throw new AppError(409, GoalErrorCode.NotActive, 'Completed or cancelled goals only allow renaming');
          await tx.goal.update({ where: { id: goalId }, data: { title: input.title } });
          const goal = (await createGoalService(createGoalRepository(tx)).list(userId, timezone)).find(
            (item) => item.id === goalId,
          );
          if (!goal) throw new AppError(404, GoalErrorCode.NotFound, 'Goal not found after update');
          return { goal, createdHabits: [], meta: { gamificationEvents: [] } };
        }
        const today = todayInTimezone(timezone);
        validateDeadline(input.deadline, today);
        const ids = input.habitIds ? await ownedHabits(tx, userId, input.habitIds) : undefined;
        const createdHabits = await createDraftHabits(tx, userId, today, input.newHabits ?? []);
        const desired = ids
          ? [...ids, ...createdHabits.map((habit) => habit.id)]
          : createdHabits.length
            ? [
                ...new Set([
                  ...(
                    await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })
                  ).map((link) => link.habitId),
                  ...createdHabits.map((habit) => habit.id),
                ]),
              ]
            : undefined;
        if (desired && !desired.length)
          throw new AppError(400, GoalErrorCode.HabitNotFound, 'Choose at least one habit');
        const goal = await createGoalService(createGoalRepository(tx)).update(userId, timezone, goalId, {
          ...input,
          habitIds: desired,
          newHabits: undefined,
        });
        return {
          goal,
          createdHabits: createdHabits.map(habitResponse),
          meta: {
            gamificationEvents: createdHabits.flatMap((habit) =>
              gamification.evaluate({
                action: GamificationAction.HabitCreated,
                habitId: habit.id,
                habitType: habit.type,
              }),
            ),
          },
        };
      });
    },
    deleteHabit(userId, timezone, habitId) {
      return unitOfWork.run(async (tx) => {
        const habit = await tx.habit.findFirst({ where: { id: habitId, userId }, select: { id: true } });
        if (!habit) throw new AppError(404, HabitErrorCode.NotFound, 'Habit not found');
        await createGoalService(createGoalRepository(tx)).disconnectHabit(userId, timezone, habitId);
        await tx.habit.delete({ where: { id: habitId } });
      });
    },
  };
}
