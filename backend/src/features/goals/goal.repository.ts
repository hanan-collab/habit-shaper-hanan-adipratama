import type { GoalStatus, Prisma, PrismaClient } from '@prisma/client';
import type { GoalWithSourceModel } from './goal.model.js';

const include = {
  habitLinks: { include: { habit: { include: { events: { orderBy: { date: 'asc' as const } } } } }, orderBy: { createdAt: 'asc' as const } },
  progressDays: { orderBy: { date: 'asc' as const } },
};

export interface GoalRepository {
  list(userId: string): Promise<GoalWithSourceModel[]>;
  find(userId: string, goalId: string): Promise<GoalWithSourceModel | null>;
  findHabits(userId: string, habitIds: string[]): Promise<{ id: string; startDate: Date }[]>;
  findActiveByHabit(userId: string, habitId: string): Promise<GoalWithSourceModel[]>;
  create(data: { userId: string; title: string; targetDays: number; deadline?: Date | null; habitIds: string[]; connectedOn: Date }): Promise<GoalWithSourceModel>;
  update(goalId: string, data: Prisma.GoalUpdateInput): Promise<void>;
  replaceLinks(goalId: string, habitIds: string[], date: Date): Promise<void>;
  connect(habitId: string, goalIds: string[], date: Date): Promise<void>;
  disconnectHabit(userId: string, habitId: string, date: Date): Promise<void>;
  setProgressDay(goalId: string, date: Date, complete: boolean): Promise<void>;
  delete(goalId: string): Promise<void>;
}

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export function createGoalRepository(prisma: DatabaseClient): GoalRepository {
  return {
    list: (userId) => prisma.goal.findMany({ where: { userId }, include, orderBy: { createdAt: 'asc' } }),
    find: (userId, id) => prisma.goal.findFirst({ where: { id, userId }, include }),
    findHabits: (userId, habitIds) => prisma.habit.findMany({ where: { userId, id: { in: habitIds } }, select: { id: true, startDate: true } }),
    findActiveByHabit: (userId, habitId) => prisma.goal.findMany({ where: { userId, status: 'ACTIVE', habitLinks: { some: { habitId, disconnectedOn: null } } }, include }),
    create: (data) => prisma.goal.create({ data: {
      userId: data.userId, title: data.title, targetDays: data.targetDays, deadline: data.deadline,
      status: 'ACTIVE' as GoalStatus,
      habitLinks: { create: data.habitIds.map((habitId) => ({ habitId, connectedOn: data.connectedOn })) },
    }, include }),
    async update(id, data) { await prisma.goal.update({ where: { id }, data }); },
    async replaceLinks(goalId, habitIds, date) {
        const active = await prisma.goalHabit.findMany({ where: { goalId, disconnectedOn: null } });
        await prisma.goalHabit.updateMany({ where: { goalId, disconnectedOn: null, habitId: { notIn: habitIds } }, data: { disconnectedOn: date } });
        const existing = new Set(active.map((link) => link.habitId));
        const additions = habitIds.filter((id) => !existing.has(id));
        if (additions.length) await prisma.goalHabit.createMany({ data: additions.map((habitId) => ({ goalId, habitId, connectedOn: date })) });
    },
    async connect(habitId, goalIds, date) {
        for (const goalId of goalIds) {
          const active = await prisma.goalHabit.findFirst({ where: { goalId, habitId, disconnectedOn: null } });
          if (!active) await prisma.goalHabit.create({ data: { goalId, habitId, connectedOn: date } });
        }
    },
    async disconnectHabit(userId, habitId, date) {
      await prisma.goalHabit.updateMany({ where: { habitId, disconnectedOn: null, goal: { userId, status: 'ACTIVE' } }, data: { disconnectedOn: date } });
    },
    async setProgressDay(goalId, date, complete) {
      if (complete) await prisma.goalProgressDay.upsert({ where: { goalId_date: { goalId, date } }, create: { goalId, date }, update: {} });
      else await prisma.goalProgressDay.deleteMany({ where: { goalId, date } });
    },
    async delete(id) { await prisma.goal.delete({ where: { id } }); },
  };
}
