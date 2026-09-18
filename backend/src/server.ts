import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createAuthRepository } from './features/auth/auth.repository.js';
import { createAuthService } from './features/auth/auth.service.js';
import { createHealthRepository } from './features/health/health.repository.js';
import { createHealthService } from './features/health/health.service.js';
import { createHabitRepository } from './features/habits/habit.repository.js';
import { createHabitService } from './features/habits/habit.service.js';
import { createStatisticsRepository } from './features/statistics/statistics.repository.js';
import { createStatisticsService } from './features/statistics/statistics.service.js';
import { createGoalRepository } from './features/goals/goal.repository.js';
import { createGoalService } from './features/goals/goal.service.js';
import { createDashboardRepository } from './features/dashboard/dashboard.repository.js';
import { createDashboardService } from './features/dashboard/dashboard.service.js';
import { createGamificationService } from './features/gamification/gamification.service.js';
import { createTrackingRepository } from './features/tracking/tracking.repository.js';
import { createTrackingService } from './features/tracking/tracking.service.js';
import { createUserStatisticsService } from './features/user-statistics/user-statistics.service.js';
import { prisma } from './lib/prisma.js';

const authRepository = createAuthRepository(prisma);
const authService = createAuthService(authRepository, {
  bcryptRounds: env.BCRYPT_ROUNDS,
  sessionTtlDays: env.SESSION_TTL_DAYS,
});
const healthService = createHealthService(createHealthRepository(() => prisma.$queryRaw`SELECT 1`));
const statisticsService = createStatisticsService(createStatisticsRepository(prisma));
const gamificationService = createGamificationService();
const habitService = createHabitService(createHabitRepository(prisma), gamificationService);
const goalService = createGoalService(createGoalRepository(prisma), statisticsService);
const trackingService = createTrackingService(
  createTrackingRepository(prisma), statisticsService, goalService, gamificationService,
);
const dashboardService = createDashboardService(
  createDashboardRepository(prisma), statisticsService, goalService, createUserStatisticsService(),
);
const app = createApp({
  healthService,
  authService,
  habitService,
  statisticsService,
  goalService,
  dashboardService,
  trackingService,
  cookieSecure: env.COOKIE_SECURE,
  frontendDirectory: fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
});
const server = app.listen(env.PORT, '0.0.0.0', () => console.log(`Habit Shaper listening on ${env.PORT}`));

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => { void prisma.$disconnect().finally(() => { clearTimeout(timeout); process.exit(0); }); });
  });
}
