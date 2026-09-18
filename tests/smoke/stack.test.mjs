import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';

const appUrl = process.env.APP_URL;
if (!appUrl || !process.env.DATABASE_URL) throw new Error('Smoke tests require APP_URL and DATABASE_URL. Use the Compose test service.');

test('production server serves health, React assets, and page fallback', async () => {
  const get = (path) => fetch(new URL(path, appUrl), { signal: AbortSignal.timeout(10000) });
  const health = await get('/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'up' });
  const home = await get('/');
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<title>Habit Shaper<\/title>/);
  const script = html.match(/src="([^\"]+\.js)"/);
  assert.ok(script, 'production HTML references a JavaScript bundle');
  const bundle = await get(script[1]);
  assert.equal(bundle.status, 200);
  assert.match(await bundle.text(), /Habit Shaper scaffold/);
  const page = await get('/app/habits');
  assert.equal(page.status, 200);
  assert.equal(await page.text(), html);
  const missing = await get('/api/missing');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Not found' });
});

test('migration creates the domain tables and enforces one event per habit/date', async () => {
  const prisma = new PrismaClient();
  const rollback = new Error('Roll back smoke fixtures');
  try {
    await assert.rejects(prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: `smoke-${randomUUID()}@example.invalid`, passwordHash: 'not-a-login-hash', timezone: 'Asia/Jakarta' } });
      const habit = await tx.habit.create({ data: { userId: user.id, name: 'Smoke fixture', type: 'BUILD', startDate: new Date('2026-01-01T00:00:00Z') } });
      const event = { habitId: habit.id, type: 'COMPLETED', date: new Date('2026-01-01T00:00:00Z') };
      await tx.habitEvent.create({ data: event });
      await assert.rejects(tx.habitEvent.create({ data: event }), (error) => error.code === 'P2002');
      const goal = await tx.goal.create({ data: { habitId: habit.id, title: 'Smoke goal', targetStreakDays: 7 } });
      assert.equal(goal.status, 'ACTIVE');
      throw rollback;
    }), (error) => error === rollback);
  } finally { await prisma.$disconnect(); }
});
