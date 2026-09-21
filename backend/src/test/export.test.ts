import { expect, test } from 'vitest';
import type { ExportRepository } from '../features/export/export.repository.js';
import { createExportService } from '../features/export/export.service.js';

test('exports serializable account data without credentials', async () => {
  const date = new Date('2026-09-21T00:00:00.000Z');
  const source = {
    id: 'user-1',
    email: 'person@example.com',
    username: 'Person',
    timezone: 'Asia/Jakarta',
    onboardingCompleted: true,
    createdAt: date,
    updatedAt: date,
    habits: [
      {
        id: 'habit-1',
        userId: 'user-1',
        name: 'Read',
        description: null,
        type: 'BUILD' as const,
        startDate: date,
        createdAt: date,
        updatedAt: date,
        events: [],
      },
    ],
    goals: [
      {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Read daily',
        targetDays: 7,
        deadline: null,
        status: 'ACTIVE' as const,
        completedDate: null,
        finalProgressDays: null,
        lastEvaluatedDate: null,
        createdAt: date,
        updatedAt: date,
        habitLinks: [
          {
            id: 'link-1',
            goalId: 'goal-1',
            habitId: 'habit-1',
            connectedOn: date,
            disconnectedOn: null,
            createdAt: date,
          },
        ],
        progressDays: [],
      },
    ],
  } satisfies Awaited<ReturnType<ExportRepository['find']>>;
  const repository: ExportRepository = { find: async () => source };

  const result = await createExportService(repository, () => date).get('user-1');

  expect(result).toMatchObject({
    exportedAt: date.toISOString(),
    user: { email: 'person@example.com' },
    habits: [{ id: 'habit-1', startDate: '2026-09-21' }],
    goals: [{ id: 'goal-1', habitLinks: [{ connectedOn: '2026-09-21' }] }],
  });
  expect(result.user).not.toHaveProperty('passwordHash');
});
