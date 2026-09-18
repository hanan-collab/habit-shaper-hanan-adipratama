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

test('register, session authentication, onboarding, logout, and login work end to end', async () => {
  const prisma = new PrismaClient();
  const email = `auth-smoke-${randomUUID()}@example.invalid`;
  const call = (path, options = {}) => fetch(new URL(path, appUrl), {
    signal: AbortSignal.timeout(15000),
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
  });
  try {
    const registration = await call('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'correct horse battery staple', timezone: 'Asia/Jakarta' }),
    });
    assert.equal(registration.status, 201);
    const registered = await registration.json();
    assert.equal(registered.user.email, email);
    assert.equal('passwordHash' in registered.user, false);
    const registrationCookie = registration.headers.get('set-cookie');
    assert.match(registrationCookie, /^habit_session=[^;]+;/);
    assert.match(registrationCookie, /HttpOnly/i);
    const cookie = registrationCookie.split(';', 1)[0];

    const me = await call('/api/auth/me', { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.email, email);

    const onboarding = await call('/api/auth/onboarding', {
      method: 'PATCH', headers: { cookie }, body: JSON.stringify({ completed: true }),
    });
    assert.equal(onboarding.status, 200);
    assert.ok((await onboarding.json()).user.onboardingCompletedAt);

    const duplicate = await call('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'another valid password', timezone: 'Asia/Jakarta' }),
    });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, 'EMAIL_ALREADY_EXISTS');

    const logout = await call('/api/auth/logout', { method: 'POST', headers: { cookie } });
    assert.equal(logout.status, 204);
    assert.equal((await call('/api/auth/me', { headers: { cookie } })).status, 401);

    const login = await call('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password: 'correct horse battery staple' }),
    });
    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie'), /^habit_session=[^;]+;/);
    const loginCookie = login.headers.get('set-cookie').split(';', 1)[0];

    const buildHabitResponse = await call('/api/habits', {
      method: 'POST', headers: { cookie: loginCookie },
      body: JSON.stringify({ name: 'Read', description: 'Smoke habit', type: 'BUILD', startDate: '2026-09-01' }),
    });
    assert.equal(buildHabitResponse.status, 201);
    const buildHabit = (await buildHabitResponse.json()).habit;
    assert.equal(buildHabit.startDate, '2026-09-01');
    const completion = await call(`/api/habits/${buildHabit.id}/completions/2026-09-18`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: JSON.stringify({ note: 'done' }),
    });
    assert.equal(completion.status, 200);
    assert.equal((await completion.json()).event.type, 'COMPLETED');
    const invalidRelapse = await call(`/api/habits/${buildHabit.id}/relapses/2026-09-18`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: '{}',
    });
    assert.equal(invalidRelapse.status, 409);
    const detail = await call(`/api/habits/${buildHabit.id}`, { headers: { cookie: loginCookie } });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).habit.events.length, 1);
    const buildStatistics = await call(`/api/habits/${buildHabit.id}/statistics`, { headers: { cookie: loginCookie } });
    assert.equal(buildStatistics.status, 200);
    assert.equal((await buildStatistics.json()).statistics.currentStreak, 0);

    const breakHabitResponse = await call('/api/habits', {
      method: 'POST', headers: { cookie: loginCookie },
      body: JSON.stringify({ name: 'No soda', type: 'BREAK', startDate: '2026-09-01' }),
    });
    assert.equal(breakHabitResponse.status, 201);
    const breakHabit = (await breakHabitResponse.json()).habit;
    assert.equal((await call(`/api/habits/${breakHabit.id}/relapses/2026-09-18`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: '{}',
    })).status, 200);
    const breakStatistics = await call(`/api/habits/${breakHabit.id}/statistics`, { headers: { cookie: loginCookie } });
    assert.equal(breakStatistics.status, 200);
    assert.equal((await breakStatistics.json()).statistics.lastRelapse, '2026-09-18');
    const habits = await call('/api/habits', { headers: { cookie: loginCookie } });
    assert.equal(habits.status, 200);
    assert.equal((await habits.json()).habits.length, 2);

    const wrongPassword = await call('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password: 'incorrect password' }),
    });
    assert.equal(wrongPassword.status, 401);
    assert.equal((await wrongPassword.json()).error.code, 'INVALID_CREDENTIALS');
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
