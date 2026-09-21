import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const timezone = 'Asia/Jakarta';
const demoEmail = process.env.DEMO_EMAIL ?? 'demo@habit-shaper.local';
const demoPassword = process.env.DEMO_PASSWORD ?? 'demo-password';

const ids = {
  user: '00000000-0000-4000-8000-000000000001',
  morningWalk: '00000000-0000-4000-8000-000000000101',
  reading: '00000000-0000-4000-8000-000000000102',
  noSoda: '00000000-0000-4000-8000-000000000103',
  steadyMorning: '00000000-0000-4000-8000-000000000201',
  readingGoal: '00000000-0000-4000-8000-000000000202',
  firstSteps: '00000000-0000-4000-8000-000000000203',
  steadyMorningWalkLink: '00000000-0000-4000-8000-000000000301',
  steadyMorningSodaLink: '00000000-0000-4000-8000-000000000302',
  readingGoalLink: '00000000-0000-4000-8000-000000000303',
  firstStepsLink: '00000000-0000-4000-8000-000000000304',
};

function todayInTimezone() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateAtOffset(offset) {
  const date = new Date(`${todayInTimezone()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

async function upsertHabitEvent(transaction, habitId, type, offset, note = null) {
  const date = dateAtOffset(offset);
  await transaction.habitEvent.upsert({
    where: { habitId_date: { habitId, date } },
    create: { habitId, type, date, note },
    update: { type, note },
  });
}

async function upsertProgressDay(transaction, goalId, offset) {
  const date = dateAtOffset(offset);
  await transaction.goalProgressDay.upsert({
    where: { goalId_date: { goalId, date } },
    create: { goalId, date },
    update: {},
  });
}

async function seed() {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(demoPassword, rounds);

  await prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email: demoEmail },
        create: {
          id: ids.user,
          email: demoEmail,
          username: 'Demo Shaper',
          passwordHash,
          timezone,
          onboardingCompleted: true,
        },
        update: {
          username: 'Demo Shaper',
          passwordHash,
          timezone,
          onboardingCompleted: true,
        },
      });

      const habits = [
        {
          id: ids.morningWalk,
          name: 'Morning walk',
          description: 'Start the day with a short walk outside.',
          type: 'BUILD',
          startDate: dateAtOffset(-9),
        },
        {
          id: ids.reading,
          name: 'Read for 20 minutes',
          description: 'Make steady space for focused reading.',
          type: 'BUILD',
          startDate: dateAtOffset(-3),
        },
        {
          id: ids.noSoda,
          name: 'No late-night soda',
          description: 'Choose water after dinner.',
          type: 'BREAK',
          startDate: dateAtOffset(-9),
        },
      ];

      for (const habit of habits) {
        await transaction.habit.upsert({
          where: { id: habit.id },
          create: { ...habit, userId: user.id },
          update: { ...habit, userId: user.id },
        });
      }

      for (let offset = -9; offset <= 0; offset += 1) {
        await upsertHabitEvent(transaction, ids.morningWalk, 'COMPLETED', offset);
      }
      for (const offset of [-3, -2, -1, 0]) {
        await upsertHabitEvent(transaction, ids.reading, 'COMPLETED', offset);
      }
      await upsertHabitEvent(transaction, ids.noSoda, 'RELAPSED', -5, 'Had soda while working late.');

      const goals = [
        {
          id: ids.steadyMorning,
          title: 'Build a steady morning',
          targetDays: 14,
          deadline: dateAtOffset(21),
          status: 'ACTIVE',
          completedDate: null,
          finalProgressDays: null,
          lastEvaluatedDate: dateAtOffset(0),
        },
        {
          id: ids.readingGoal,
          title: 'Read consistently for ten days',
          targetDays: 10,
          deadline: dateAtOffset(18),
          status: 'ACTIVE',
          completedDate: null,
          finalProgressDays: null,
          lastEvaluatedDate: dateAtOffset(0),
        },
        {
          id: ids.firstSteps,
          title: 'Complete the first three steps',
          targetDays: 3,
          deadline: dateAtOffset(-7),
          status: 'COMPLETED',
          completedDate: dateAtOffset(-7),
          finalProgressDays: 3,
          lastEvaluatedDate: dateAtOffset(-7),
        },
      ];

      for (const goal of goals) {
        await transaction.goal.upsert({
          where: { id: goal.id },
          create: { ...goal, userId: user.id },
          update: { ...goal, userId: user.id },
        });
      }

      const links = [
        { id: ids.steadyMorningWalkLink, goalId: ids.steadyMorning, habitId: ids.morningWalk },
        { id: ids.steadyMorningSodaLink, goalId: ids.steadyMorning, habitId: ids.noSoda },
        { id: ids.readingGoalLink, goalId: ids.readingGoal, habitId: ids.reading },
        { id: ids.firstStepsLink, goalId: ids.firstSteps, habitId: ids.morningWalk },
      ];
      for (const link of links) {
        await transaction.goalHabit.upsert({
          where: { id: link.id },
          create: { ...link, connectedOn: dateAtOffset(-9) },
          update: { goalId: link.goalId, habitId: link.habitId, connectedOn: dateAtOffset(-9), disconnectedOn: null },
        });
      }

      for (const offset of [-9, -8, -7, -6, -4, -3, -2, -1, 0]) {
        await upsertProgressDay(transaction, ids.steadyMorning, offset);
      }
      for (const offset of [-3, -2, -1, 0]) {
        await upsertProgressDay(transaction, ids.readingGoal, offset);
      }
      for (const offset of [-9, -8, -7]) {
        await upsertProgressDay(transaction, ids.firstSteps, offset);
      }
    },
    { timeout: 20_000 },
  );

  console.log(`Demo data ready for ${demoEmail}`);
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
