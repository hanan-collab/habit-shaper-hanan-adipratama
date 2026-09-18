import type { PrismaClient } from '@prisma/client';
import type { StatisticsSourceModel } from './statistics.model.js';

export interface StatisticsRepository {
  findSource(userId: string, habitId: string): Promise<StatisticsSourceModel | null>;
}

export function createStatisticsRepository(prisma: PrismaClient): StatisticsRepository {
  return {
    findSource(userId, habitId) {
      return prisma.habit.findFirst({
        where: { id: habitId, userId }, include: { events: { orderBy: { date: 'asc' } } },
      });
    },
  };
}
