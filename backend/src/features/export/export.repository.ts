import type { Prisma, PrismaClient } from '@prisma/client';

const exportSelect = {
  id: true,
  email: true,
  username: true,
  timezone: true,
  onboardingCompleted: true,
  createdAt: true,
  updatedAt: true,
  habits: { include: { events: { orderBy: { date: 'asc' as const } } }, orderBy: { createdAt: 'asc' as const } },
  goals: {
    include: {
      habitLinks: { orderBy: { createdAt: 'asc' as const } },
      progressDays: { orderBy: { date: 'asc' as const } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.UserSelect;

export type ExportSource = Prisma.UserGetPayload<{ select: typeof exportSelect }>;

export interface ExportRepository {
  find(userId: string): Promise<ExportSource | null>;
}

export function createExportRepository(prisma: PrismaClient): ExportRepository {
  return {
    find: (userId) => prisma.user.findUnique({ where: { id: userId }, select: exportSelect }),
  };
}
