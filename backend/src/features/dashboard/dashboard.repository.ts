import type { PrismaClient } from '@prisma/client';
import type { DashboardHabitSourceModel } from './dashboard.model.js';

export interface DashboardRepository {
  listHabits(userId: string): Promise<DashboardHabitSourceModel[]>;
}

export function createDashboardRepository(prisma: PrismaClient): DashboardRepository {
  return {
    listHabits(userId) {
      return prisma.habit.findMany({
        where: { userId },
        include: {
          events: { orderBy: { date: 'asc' } },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
    },
  };
}
