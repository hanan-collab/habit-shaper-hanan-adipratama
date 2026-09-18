import { Prisma, type GoalStatus, type PrismaClient } from '@prisma/client';
import type { GoalModel, GoalWithSourceModel } from './goal.model.js';
import type { StatisticsSourceModel } from '../statistics/statistics.model.js';

export class ActiveGoalRepositoryError extends Error {}

const sourceInclude = { events: { orderBy: { date: 'asc' as const } } };

export interface GoalRepository {
  list(userId: string): Promise<GoalWithSourceModel[]>;
  find(userId: string, goalId: string): Promise<GoalWithSourceModel | null>;
  findHabit(userId: string, habitId: string): Promise<StatisticsSourceModel | null>;
  findActive(userId: string, habitId: string): Promise<GoalWithSourceModel | null>;
  create(data: { habitId: string; title: string; targetStreakDays: number; deadline?: Date | null; status: GoalStatus; activeSlot: number | null; completedDate: Date | null }): Promise<GoalModel>;
  update(goalId: string, data: Prisma.GoalUpdateInput): Promise<GoalModel>;
  delete(goalId: string): Promise<void>;
}

export function createGoalRepository(prisma: PrismaClient): GoalRepository {
  return {
    list(userId) {
      return prisma.goal.findMany({
        where: { habit: { userId } }, include: { habit: { include: sourceInclude } }, orderBy: { createdAt: 'asc' },
      });
    },
    find(userId, goalId) {
      return prisma.goal.findFirst({ where: { id: goalId, habit: { userId } }, include: { habit: { include: sourceInclude } } });
    },
    findHabit(userId, habitId) {
      return prisma.habit.findFirst({ where: { id: habitId, userId }, include: sourceInclude });
    },
    findActive(userId, habitId) {
      return prisma.goal.findFirst({
        where: { habitId, activeSlot: 1, habit: { userId } }, include: { habit: { include: sourceInclude } },
      });
    },
    async create(data) {
      try { return await prisma.goal.create({ data }); }
      catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ActiveGoalRepositoryError();
        throw error;
      }
    },
    update(goalId, data) { return prisma.goal.update({ where: { id: goalId }, data }); },
    async delete(goalId) { await prisma.goal.delete({ where: { id: goalId } }); },
  };
}
