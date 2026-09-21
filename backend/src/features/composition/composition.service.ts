import type { GoalStatus, HabitType, Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../common/app-error.js';
import { GamificationAction } from '../gamification/gamification.enum.js';
import type { GamificationService } from '../gamification/gamification.service.js';
import { goalDate, type CreateMultiGoalDto, type UpdateGoalDto } from '../goals/goal.dto.js';
import { GoalErrorCode, GoalState } from '../goals/goal.enum.js';
import { createGoalRepository } from '../goals/goal.repository.js';
import { createGoalService } from '../goals/goal.service.js';
import { habitResponse } from '../habits/habit.model.js';
import type { CreateHabitDto, UpdateHabitGoalsDto } from '../habits/habit.dto.js';
import { HabitErrorCode } from '../habits/habit.enum.js';

const todayIn = (timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};
const normalize = (value: string) => value.trim().toLocaleLowerCase();

export interface CompositionService {
  createHabit(userId: string, timezone: string, input: CreateHabitDto): Promise<unknown>;
  updateHabitGoals(userId: string, timezone: string, habitId: string, input: UpdateHabitGoalsDto): Promise<unknown>;
  createGoal(userId: string, timezone: string, input: CreateMultiGoalDto): Promise<unknown>;
  updateGoal(userId: string, timezone: string, goalId: string, input: UpdateGoalDto): Promise<unknown>;
}

export function createCompositionService(prisma: PrismaClient, gamification: GamificationService): CompositionService {
  const validateDeadline = (deadline: string | null | undefined, today: string) => {
    if (deadline && deadline < today) throw new AppError(400, GoalErrorCode.InvalidDeadline, 'Goal deadline cannot be in the past');
  };
  const validateNames = (values: string[]) => {
    if (new Set(values.map(normalize)).size !== values.length) throw new AppError(400, 'DUPLICATE_DRAFT', 'Already added.');
  };
  const activeGoals = async (tx: Prisma.TransactionClient, userId: string, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) throw new AppError(400, 'DUPLICATE_RELATION', 'Already added.');
    const goals = await tx.goal.findMany({ where: { userId, id: { in: unique } } });
    if (goals.length !== unique.length) throw new AppError(404, GoalErrorCode.NotFound, 'One or more goals were not found');
    if (goals.some(goal => goal.status !== GoalState.Active)) throw new AppError(409, GoalErrorCode.NotActive, 'Habits can only connect to active goals');
    return unique;
  };
  const ownedHabits = async (tx: Prisma.TransactionClient, userId: string, ids: string[]) => {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) throw new AppError(400, 'DUPLICATE_RELATION', 'Already added.');
    const habits = await tx.habit.findMany({ where: { userId, id: { in: unique } }, select: { id: true } });
    if (habits.length !== unique.length) throw new AppError(404, GoalErrorCode.HabitNotFound, 'One or more habits were not found');
    return unique;
  };
  const createDraftHabits = async (tx: Prisma.TransactionClient, userId: string, today: string, drafts: NonNullable<CreateMultiGoalDto['newHabits']>) => {
    validateNames(drafts.map(draft => draft.name));
    const created = [];
    for (const draft of drafts) created.push(await tx.habit.create({ data: { userId, name: draft.name, description: null, type: draft.type as HabitType, startDate: goalDate(today) } }));
    return created;
  };
  const createDraftGoals = async (tx: Prisma.TransactionClient, userId: string, timezone: string, today: string, habitId: string, drafts: NonNullable<CreateHabitDto['newGoals']>) => {
    validateNames(drafts.map(draft => draft.title));
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
      return prisma.$transaction(async tx => {
        const today = todayIn(timezone);
        const goalIds = await activeGoals(tx, userId, input.goalIds ?? []);
        const habit = await tx.habit.create({ data: { userId, name: input.name, description: input.description, type: input.type as HabitType, startDate: goalDate(today) } });
        if (goalIds.length) await tx.goalHabit.createMany({ data: goalIds.map(goalId => ({ goalId, habitId: habit.id, connectedOn: goalDate(today) })) });
        const goalService = createGoalService(createGoalRepository(tx));
        for (const goalId of goalIds) await goalService.update(userId, timezone, goalId, { habitIds: (await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })).map(item => item.habitId) });
        const createdGoals = await createDraftGoals(tx, userId, timezone, today, habit.id, input.newGoals ?? []);
        return { habit: habitResponse(habit), createdGoals, meta: { gamificationEvents: gamification.evaluate({ action: GamificationAction.HabitCreated, habitId: habit.id, habitType: habit.type }) } };
      });
    },
    updateHabitGoals(userId, timezone, habitId, input) {
      return prisma.$transaction(async tx => {
        const habit = await tx.habit.findFirst({ where: { id: habitId, userId } });
        if (!habit) throw new AppError(404, HabitErrorCode.NotFound, 'Habit not found');
        const today = todayIn(timezone); const date = goalDate(today);
        const goalIds = await activeGoals(tx, userId, input.goalIds);
        const current = await tx.goalHabit.findMany({ where: { habitId, disconnectedOn: null, goal: { userId, status: GoalState.Active } } });
        const desired = new Set(goalIds); const currentIds = new Set(current.map(link => link.goalId));
        const removed = current.filter(link => !desired.has(link.goalId));
        if (removed.length) await tx.goalHabit.updateMany({ where: { id: { in: removed.map(link => link.id) } }, data: { disconnectedOn: date } });
        const additions = goalIds.filter(id => !currentIds.has(id));
        if (additions.length) await tx.goalHabit.createMany({ data: additions.map(goalId => ({ goalId, habitId, connectedOn: date })) });
        const createdGoals = await createDraftGoals(tx, userId, timezone, today, habitId, input.newGoals);
        const goalService = createGoalService(createGoalRepository(tx));
        for (const link of removed) {
          const remaining = await tx.goalHabit.count({ where: { goalId: link.goalId, disconnectedOn: null } });
          if (!remaining) await tx.goal.update({ where: { id: link.goalId }, data: { status: GoalState.Cancelled as GoalStatus, finalProgressDays: await tx.goalProgressDay.count({ where: { goalId: link.goalId } }) } });
          else await goalService.update(userId, timezone, link.goalId, { habitIds: (await tx.goalHabit.findMany({ where: { goalId: link.goalId, disconnectedOn: null }, select: { habitId: true } })).map(item => item.habitId) });
        }
        for (const goalId of additions) await goalService.update(userId, timezone, goalId, { habitIds: (await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })).map(item => item.habitId) });
        return { habit: habitResponse(habit), createdGoals, goalIds: [...goalIds, ...createdGoals.map(goal => goal.id)], meta: { gamificationEvents: [] } };
      });
    },
    createGoal(userId, timezone, input) {
      return prisma.$transaction(async tx => {
        const today = todayIn(timezone); validateDeadline(input.deadline, today);
        const ids = await ownedHabits(tx, userId, input.habitIds);
        const createdHabits = await createDraftHabits(tx, userId, today, input.newHabits ?? []);
        const allIds = [...ids, ...createdHabits.map(habit => habit.id)];
        if (!allIds.length) throw new AppError(400, GoalErrorCode.HabitNotFound, 'Choose at least one habit');
        const goal = await createGoalService(createGoalRepository(tx)).createMulti(userId, timezone, { ...input, habitIds: allIds, newHabits: [] });
        return { goal, createdHabits: createdHabits.map(habitResponse), meta: { gamificationEvents: createdHabits.flatMap(habit => gamification.evaluate({ action: GamificationAction.HabitCreated, habitId: habit.id, habitType: habit.type })) } };
      });
    },
    updateGoal(userId, timezone, goalId, input) {
      return prisma.$transaction(async tx => {
        const existing = await tx.goal.findFirst({ where: { id: goalId, userId } });
        if (!existing) throw new AppError(404, GoalErrorCode.NotFound, 'Goal not found');
        if (existing.status !== GoalState.Active) {
          if (Object.keys(input).some(key => key !== 'title')) throw new AppError(409, GoalErrorCode.NotActive, 'Completed or cancelled goals only allow renaming');
          await tx.goal.update({ where: { id: goalId }, data: { title: input.title } });
          return { goal: (await createGoalService(createGoalRepository(tx)).list(userId, timezone)).find(goal => goal.id === goalId), createdHabits: [], meta: { gamificationEvents: [] } };
        }
        const today = todayIn(timezone); validateDeadline(input.deadline, today);
        const ids = input.habitIds ? await ownedHabits(tx, userId, input.habitIds) : undefined;
        const createdHabits = await createDraftHabits(tx, userId, today, input.newHabits ?? []);
        const desired = ids ? [...ids, ...createdHabits.map(habit => habit.id)] : createdHabits.length ? [...new Set([...(await tx.goalHabit.findMany({ where: { goalId, disconnectedOn: null }, select: { habitId: true } })).map(link => link.habitId), ...createdHabits.map(habit => habit.id)])] : undefined;
        if (desired && !desired.length) throw new AppError(400, GoalErrorCode.HabitNotFound, 'Choose at least one habit');
        const goal = await createGoalService(createGoalRepository(tx)).update(userId, timezone, goalId, { ...input, habitIds: desired, newHabits: undefined });
        return { goal, createdHabits: createdHabits.map(habitResponse), meta: { gamificationEvents: createdHabits.flatMap(habit => gamification.evaluate({ action: GamificationAction.HabitCreated, habitId: habit.id, habitType: habit.type })) } };
      });
    },
  };
}
