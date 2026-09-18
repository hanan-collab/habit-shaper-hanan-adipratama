import type { HabitType, HabitEventType, Prisma, PrismaClient } from '@prisma/client';
import type { HabitDetailModel, HabitEventModel, HabitModel } from './habit.model.js';

export interface HabitRepository {
  list(userId: string): Promise<HabitModel[]>;
  findDetail(userId: string, habitId: string): Promise<HabitDetailModel | null>;
  create(data: { userId: string; name: string; description?: string | null; type: HabitType; startDate: Date }): Promise<HabitModel>;
  update(habitId: string, data: Prisma.HabitUpdateInput): Promise<HabitModel>;
  delete(habitId: string): Promise<void>;
  countEvents(habitId: string): Promise<number>;
  findEarliestEvent(habitId: string): Promise<HabitEventModel | null>;
  upsertEvent(data: { habitId: string; type: HabitEventType; date: Date; note?: string | null }): Promise<HabitEventModel>;
  deleteEvent(habitId: string, date: Date, type: HabitEventType): Promise<void>;
}

export function createHabitRepository(prisma: PrismaClient): HabitRepository {
  return {
    list(userId) {
      return prisma.habit.findMany({ where: { userId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    },
    findDetail(userId, habitId) {
      return prisma.habit.findFirst({
        where: { id: habitId, userId }, include: { events: { orderBy: { date: 'asc' } } },
      });
    },
    create(data) { return prisma.habit.create({ data }); },
    update(habitId, data) { return prisma.habit.update({ where: { id: habitId }, data }); },
    async delete(habitId) { await prisma.habit.delete({ where: { id: habitId } }); },
    countEvents(habitId) { return prisma.habitEvent.count({ where: { habitId } }); },
    findEarliestEvent(habitId) {
      return prisma.habitEvent.findFirst({ where: { habitId }, orderBy: { date: 'asc' } });
    },
    upsertEvent(data) {
      return prisma.habitEvent.upsert({
        where: { habitId_date: { habitId: data.habitId, date: data.date } },
        create: data,
        update: { type: data.type, note: data.note },
      });
    },
    async deleteEvent(habitId, date, type) {
      await prisma.habitEvent.deleteMany({ where: { habitId, date, type } });
    },
  };
}
