import type { PrismaClient } from '@prisma/client';
import type { StatisticsSourceModel } from './statistics.model.js';

export interface StatisticsRepository {
  findSource(userId: string, habitId: string): Promise<StatisticsSourceModel | null>;
  listSources(userId: string): Promise<StatisticsSourceModel[]>;
}

export function createStatisticsRepository(prisma: PrismaClient): StatisticsRepository {
  return {
    listSources(userId) {
      return prisma.habit.findMany({
        where: { userId },
        include: { events: { orderBy: { date: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      });
    },
    findSource(userId, habitId) {
      return prisma.habit.findFirst({
        where: { id: habitId, userId },
        include: { events: { orderBy: { date: 'asc' } } },
      });
    },
  };
}
