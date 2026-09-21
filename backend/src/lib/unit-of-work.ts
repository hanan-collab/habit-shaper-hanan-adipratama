import type { Prisma, PrismaClient } from '@prisma/client';

export type TransactionContext = Prisma.TransactionClient;

export interface UnitOfWork {
  run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T>;
}

export function createPrismaUnitOfWork(prisma: PrismaClient): UnitOfWork {
  return { run: (work) => prisma.$transaction(work) };
}
