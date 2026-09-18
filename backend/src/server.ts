import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createAuthRepository } from './features/auth/auth.repository.js';
import { createAuthService } from './features/auth/auth.service.js';
import { createHealthRepository } from './features/health/health.repository.js';
import { createHealthService } from './features/health/health.service.js';
import { createHabitRepository } from './features/habits/habit.repository.js';
import { createHabitService } from './features/habits/habit.service.js';
import { prisma } from './lib/prisma.js';

const authRepository = createAuthRepository(prisma);
const authService = createAuthService(authRepository, {
  bcryptRounds: env.BCRYPT_ROUNDS,
  sessionTtlDays: env.SESSION_TTL_DAYS,
});
const healthService = createHealthService(createHealthRepository(() => prisma.$queryRaw`SELECT 1`));
const habitService = createHabitService(createHabitRepository(prisma));
const app = createApp({
  healthService,
  authService,
  habitService,
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
