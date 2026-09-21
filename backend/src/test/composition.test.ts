import type { PrismaClient } from '@prisma/client';
import { describe, expect, test, vi } from 'vitest';
import { createCompositionService } from '../features/composition/composition.service.js';
import { createPrismaUnitOfWork } from '../lib/unit-of-work.js';
import { createGamificationService } from '../features/gamification/gamification.service.js';
import { HabitKind } from '../features/habits/habit.enum.js';

const userId = '00000000-0000-4000-8000-000000000001';
const goalId = '00000000-0000-4000-8000-000000000002';
const now = new Date();

function transactionalFake(
  options: {
    goals?: Array<{ id: string; userId: string; status: 'ACTIVE' }>;
    failGoalCreate?: boolean;
    failLinks?: boolean;
  } = {},
) {
  const state = { habits: [] as Array<{ id: string }>, links: [] as unknown[], goals: [] as unknown[] };
  const tx = {
    goal: {
      findMany: vi.fn(async () => options.goals ?? []),
      create: vi.fn(async () => {
        if (options.failGoalCreate) throw new Error('goal create failed');
        return {};
      }),
    },
    habit: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
        state.habits.filter((item) => where.id.in.includes(item.id)).map((item) => ({ id: item.id })),
      ),
      create: vi.fn(async ({ data }: { data: object }) => {
        const habit = { id: `habit-${state.habits.length + 1}`, ...data, createdAt: now, updatedAt: now };
        state.habits.push(habit);
        return habit;
      }),
    },
    goalHabit: {
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
        if (options.failLinks) throw new Error('link failed');
        state.links.push(...data);
      }),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => {
      const snapshot = structuredClone(state);
      try {
        return await work(tx);
      } catch (error) {
        state.habits = snapshot.habits;
        state.links = snapshot.links;
        state.goals = snapshot.goals;
        throw error;
      }
    }),
  } as unknown as PrismaClient;
  return { prisma, state };
}

describe('atomic composition', () => {
  test('rolls back the root habit when an existing-goal connection fails', async () => {
    const fake = transactionalFake({ goals: [{ id: goalId, userId, status: 'ACTIVE' }], failLinks: true });
    const service = createCompositionService(createPrismaUnitOfWork(fake.prisma), createGamificationService());
    await expect(
      service.createHabit(userId, 'Asia/Jakarta', { name: 'Read', type: HabitKind.Build, goalIds: [goalId] }),
    ).rejects.toThrow('link failed');
    expect(fake.state.habits).toEqual([]);
    expect(fake.state.links).toEqual([]);
  });

  test('rolls back a root habit when draft goal creation fails', async () => {
    const fake = transactionalFake({ failGoalCreate: true });
    const service = createCompositionService(createPrismaUnitOfWork(fake.prisma), createGamificationService());
    await expect(
      service.createHabit(userId, 'Asia/Jakarta', {
        name: 'Read',
        type: HabitKind.Build,
        newGoals: [{ title: 'Focused week', targetDays: 7 }],
      }),
    ).rejects.toThrow('goal create failed');
    expect(fake.state.habits).toEqual([]);
    expect(fake.prisma.$transaction).toHaveBeenCalledOnce();
  });
});
