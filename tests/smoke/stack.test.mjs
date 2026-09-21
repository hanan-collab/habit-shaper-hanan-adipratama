import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';

const appUrl = process.env.APP_URL;
if (!appUrl || !process.env.DATABASE_URL) throw new Error('Smoke tests require APP_URL and DATABASE_URL. Use the Compose test service.');
const localDate = (timezone) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

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
  assert.match(await bundle.text(), /Small actions\. Visible progress/);
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
      const user = await tx.user.create({ data: { email: `smoke-${randomUUID()}@example.invalid`, username: 'smoke', passwordHash: 'not-a-login-hash', timezone: 'Asia/Jakarta' } });
      const habit = await tx.habit.create({ data: { userId: user.id, name: 'Smoke fixture', type: 'BUILD', startDate: new Date('2026-01-01T00:00:00Z') } });
      const event = { habitId: habit.id, type: 'COMPLETED', date: new Date('2026-01-01T00:00:00Z') };
      await tx.habitEvent.create({ data: event });
      await assert.rejects(tx.habitEvent.create({ data: event }), (error) => error.code === 'P2002');
      const goal = await tx.goal.create({ data: { userId: user.id, title: 'Smoke goal', targetDays: 7, habitLinks: { create: { habitId: habit.id, connectedOn: new Date('2026-01-01T00:00:00Z') } } } });
      assert.equal(goal.status, 'ACTIVE');
      throw rollback;
    }), (error) => error === rollback);
  } finally { await prisma.$disconnect(); }
});

test('register, session authentication, onboarding, logout, and login work end to end', async () => {
  const prisma = new PrismaClient();
  const email = `auth-smoke-${randomUUID()}@example.invalid`;
  const trackingDate = localDate('Asia/Jakarta');
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
      method: 'PATCH', headers: { cookie }, body: JSON.stringify({ completed: true, timezone: 'Asia/Jakarta' }),
    });
    assert.equal(onboarding.status, 200);
    assert.equal((await onboarding.json()).user.onboardingCompleted, true);

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
      body: JSON.stringify({ name: 'Read', description: 'Smoke habit', type: 'BUILD' }),
    });
    assert.equal(buildHabitResponse.status, 201);
    const buildHabitBody = await buildHabitResponse.json();
    const buildHabit = buildHabitBody.habit;
    assert.equal(buildHabit.startDate, localDate('Asia/Jakarta'));
    assert.deepEqual(buildHabitBody.meta.gamificationEvents.map(({ type }) => type), ['HABIT_CREATED']);
    const completion = await call(`/api/habits/${buildHabit.id}/completions/${trackingDate}`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: JSON.stringify({ note: 'done' }),
    });
    assert.equal(completion.status, 200);
    const completionBody = await completion.json();
    assert.equal(completionBody.data.event.type, 'COMPLETED');
    assert.ok(completionBody.meta.gamificationEvents.some(({ type }) => type === 'FIRST_CHECK_IN'));
    const completionRetry = await call(`/api/habits/${buildHabit.id}/completions/${trackingDate}`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: JSON.stringify({ note: 'done' }),
    });
    assert.equal(completionRetry.status, 200);
    assert.deepEqual((await completionRetry.json()).meta.gamificationEvents, []);
    const invalidRelapse = await call(`/api/habits/${buildHabit.id}/relapses/${trackingDate}`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: '{}',
    });
    assert.equal(invalidRelapse.status, 409);
    const detail = await call(`/api/habits/${buildHabit.id}`, { headers: { cookie: loginCookie } });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).habit.events.length, 1);
    const buildStatistics = await call(`/api/habits/${buildHabit.id}/statistics`, { headers: { cookie: loginCookie } });
    assert.equal(buildStatistics.status, 200);
    assert.equal((await buildStatistics.json()).statistics.currentStreak, 1);
    const createGoal = await call(`/api/habits/${buildHabit.id}/goals`, {
      method: 'POST', headers: { cookie: loginCookie },
      body: JSON.stringify({ title: 'Read for a week', targetDays: 7 }),
    });
    assert.equal(createGoal.status, 201);
    const goal = (await createGoal.json()).goal;
    assert.equal(goal.status, 'ACTIVE');
    assert.equal(goal.progress.remainingDays, 6);
    const secondGoalResponse = await call(`/api/habits/${buildHabit.id}/goals`, {
      method: 'POST', headers: { cookie: loginCookie }, body: JSON.stringify({ title: 'Second active goal', targetDays: 2 }),
    });
    assert.equal(secondGoalResponse.status, 201);
    const secondGoal = (await secondGoalResponse.json()).goal;
    const updateGoal = await call(`/api/goals/${goal.id}`, {
      method: 'PATCH', headers: { cookie: loginCookie }, body: JSON.stringify({ title: 'Updated goal' }),
    });
    assert.equal(updateGoal.status, 200);
    assert.equal((await updateGoal.json()).goal.title, 'Updated goal');
    const cancelGoal = await call(`/api/goals/${goal.id}/cancel`, { method: 'POST', headers: { cookie: loginCookie } });
    assert.equal(cancelGoal.status, 200);
    assert.equal((await cancelGoal.json()).goal.status, 'CANCELLED');
    const cancelSecondGoal = await call(`/api/goals/${secondGoal.id}/cancel`, { method: 'POST', headers: { cookie: loginCookie } });
    assert.equal(cancelSecondGoal.status, 200);
    const goals = await call('/api/goals', { headers: { cookie: loginCookie } });
    assert.equal(goals.status, 200);
    assert.equal((await goals.json()).goals.length, 2);

    const breakHabitResponse = await call('/api/habits', {
      method: 'POST', headers: { cookie: loginCookie },
      body: JSON.stringify({ name: 'No soda', type: 'BREAK', startDate: '2026-09-01' }),
    });
    assert.equal(breakHabitResponse.status, 201);
    const breakHabit = (await breakHabitResponse.json()).habit;
    const relapseResponse = await call(`/api/habits/${breakHabit.id}/relapses/${trackingDate}`, {
      method: 'PUT', headers: { cookie: loginCookie }, body: '{}',
    });
    assert.equal(relapseResponse.status, 200);
    assert.deepEqual((await relapseResponse.json()).meta.gamificationEvents.map(({ type }) => type), ['RELAPSE_RECORDED']);
    const breakStatistics = await call(`/api/habits/${breakHabit.id}/statistics`, { headers: { cookie: loginCookie } });
    assert.equal(breakStatistics.status, 200);
    assert.equal((await breakStatistics.json()).statistics.lastRelapse, trackingDate);
    const habits = await call('/api/habits', { headers: { cookie: loginCookie } });
    assert.equal(habits.status, 200);
    assert.equal((await habits.json()).habits.length, 2);
    const dashboard = await call('/api/dashboard', { headers: { cookie: loginCookie } });
    assert.equal(dashboard.status, 200);
    const dashboardBody = (await dashboard.json()).dashboard;
    assert.deepEqual(dashboardBody.summary, { activeHabits: 2, activeGoals: 0 });
    assert.equal(dashboardBody.habits.length, 2);
    assert.equal(dashboardBody.userStatistics.totalBuildCompletions, 1);
    assert.equal(dashboardBody.userStatistics.totalGoalsCompleted, 0);

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
