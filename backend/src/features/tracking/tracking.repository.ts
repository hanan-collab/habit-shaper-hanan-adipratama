import { Prisma, type HabitEventType, type PrismaClient } from '@prisma/client';
import type { PutTrackingEventModel, TrackingSourceModel } from './tracking.model.js';

export interface TrackingRepository {
  findSource(userId: string, habitId: string): Promise<TrackingSourceModel | null>;
  putEvent(data: { habitId: string; type: HabitEventType; date: Date; note?: string | null }): Promise<PutTrackingEventModel>;
  deleteEvent(habitId: string, date: Date, type: HabitEventType): Promise<void>;
}

export function createTrackingRepository(prisma: PrismaClient): TrackingRepository {
  return {
    findSource(userId, habitId) {
      return prisma.habit.findFirst({
        where: { id: habitId, userId },
        include: {
          events: { orderBy: { date: 'asc' } },
          goals: { where: { activeSlot: 1 }, orderBy: { createdAt: 'asc' } },
        },
      });
    },
    async putEvent(data) {
      const where = { habitId_date: { habitId: data.habitId, date: data.date } };
      const existing = await prisma.habitEvent.findUnique({ where });
      if (existing) {
        return {
          event: await prisma.habitEvent.update({ where, data: { note: data.note } }),
          created: false,
        };
      }
      try {
        return { event: await prisma.habitEvent.create({ data }), created: true };
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        return {
          event: await prisma.habitEvent.update({ where, data: { note: data.note } }),
          created: false,
        };
      }
    },
    async deleteEvent(habitId, date, type) {
      await prisma.habitEvent.deleteMany({ where: { habitId, date, type } });
    },
  };
}
