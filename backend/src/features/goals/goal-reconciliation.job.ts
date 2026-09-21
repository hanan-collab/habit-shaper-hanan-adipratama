import type { PrismaClient } from '@prisma/client';
import { createGoalRepository } from './goal.repository.js';
import { createGoalService } from './goal.service.js';

export interface GoalReconciliationJob {
  run(): Promise<void>;
  start(intervalMs?: number): () => void;
}

export function createGoalReconciliationJob(prisma: PrismaClient): GoalReconciliationJob {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const users = await prisma.user.findMany({
        where: { goals: { some: { status: 'ACTIVE' } } },
        select: { id: true, timezone: true },
      });
      for (const user of users) {
        await prisma.$transaction(async (tx) => {
          await createGoalService(createGoalRepository(tx)).reconcileAll(user.id, user.timezone);
        });
      }
    } finally {
      running = false;
    }
  };
  return {
    run,
    start(intervalMs = 60 * 60 * 1000) {
      void run().catch((error) =>
        console.error(JSON.stringify({ level: 'error', job: 'goal-reconciliation', error: String(error) })),
      );
      const timer = setInterval(() => {
        void run().catch((error) =>
          console.error(JSON.stringify({ level: 'error', job: 'goal-reconciliation', error: String(error) })),
        );
      }, intervalMs);
      timer.unref();
      return () => clearInterval(timer);
    },
  };
}
