# Habit Shaper

Full-stack implementation of [plan.md](plan.md) and the Monument design handoff. React + Vite + TypeScript live in `frontend/`; Express + TypeScript + Prisma live in `backend/`. MySQL 8.4 supplies the database. Express serves the React production build and `/api` on one origin; no Nginx or CORS configuration is needed.

## Start with Docker

Install Docker Desktop with its Linux engine running and Docker Compose v2. From the repository root, copy the environment template:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead. Then run:

```sh
docker compose build
docker compose up --build -d --wait
```

Open <http://localhost:3000>. The default runtime contains only `app` and `db`. The app waits for MySQL readiness, automatically applies checked-in Prisma migrations, and starts Express. Failed migrations stop startup. Database data persists in a named volume. MySQL is available from the host on `127.0.0.1:3306` by default.

```sh
docker compose logs app db
docker compose down
```

`down` preserves database data. Changing initial MySQL credentials in `.env` does not modify an existing database volume.

## Build and test artifacts

The root Dockerfile has dependency, frontend-build, backend-build, test, and production stages. Production contains compiled application assets, production dependencies, and Prisma migration tooling. Generated `frontend/dist/`, `backend/dist/`, and `node_modules/` stay out of version control; commit `package-lock.json` and migrations.

Run the full test workflow after startup:

```sh
docker compose --profile test run --build --rm test
```

The optional test service runs TypeScript checks, Vitest/React Testing Library/Supertest tests, and stack smoke tests. It returns a nonzero exit code on failure. Smoke tests exercise the production HTML/JavaScript, every API feature, all five database models, migrations, ownership, event rules, and active-goal uniqueness. Test users and their dependent records are removed afterward.

To verify migration redeployment and persistence:

```sh
docker compose restart app
docker compose up -d --wait
docker compose --profile test run --rm test
```

To exercise the test runner's failure exit status without changing files:

```sh
docker compose --profile test run --rm -e APP_URL=http://127.0.0.1:1 test npm run test:smoke
```

This last command must fail because its application URL is deliberately unreachable.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_PORT` | `3000` | Host HTTP port |
| `MYSQL_PORT` | `3306` | MySQL port published on the host |
| `MYSQL_DATABASE` | `habit_shaper` | Initial database |
| `MYSQL_USER` | `habit_shaper` | Application database user |
| `MYSQL_PASSWORD` | `scaffold_password` | Local development password |
| `MYSQL_ROOT_PASSWORD` | `scaffold_root_password` | MySQL initialization password |
| `BCRYPT_ROUNDS` | `12` | Password hashing work factor (`10`–`15`) |
| `SESSION_TTL_DAYS` | `7` | Login session lifetime (`1`–`90` days) |
| `COOKIE_SECURE` | `false` | Send session cookies only over HTTPS; enable behind production TLS |
| `DATABASE_URL` | Assembled by Compose | Prisma connection URL inside app/test containers |
| `PORT` | `3000` | Internal Express port |
| `APP_URL` | `http://app:3000` in tests | Smoke-test target |

The example values are public local-development defaults, not real secrets. Replace them for shared deployments. Keep database identifiers and credentials URL-safe because Compose interpolates them into `DATABASE_URL`. Do not commit `.env`.

## Local development

Use Node.js 22.12+ and npm. Containers use Node.js 22. The lockfile pins resolved dependencies; Prisma CLI/client are intentionally matched at version 6.19.0 with the Prisma 6 MySQL schema/generator configuration.

Root dependency overrides update Prisma's configuration dependencies (`deepmerge-ts` and `effect`) to patched versions. Keep these overrides until an upstream Prisma update incorporates the fixes; validate client generation and migration deployment when updating them.

```sh
npm ci
npm run generate
npm run typecheck
npm run build
npm test
npm run dev:frontend
```

For local backend development, set `DATABASE_URL` in your shell to the Compose database at `127.0.0.1:3306`, apply `npm run migrate:deploy --workspace backend`, then run `npm run dev:backend` in another terminal. Vite proxies `/api` to `http://localhost:3000`. The backend does not automatically load the root `.env`; Docker Compose supplies its environment.

## Structure and implementation boundary

- Frontend: feature pages cover landing, authentication, onboarding, dashboard, habits, goals, statistics, settings, gamification responses, and the public Brand Kit. React Router owns route boundaries, TanStack Query owns server state, React Hook Form and Zod own form validation, and CSS Modules implement the responsive Monument design system.
- Backend: each feature uses `route → controller → service → repository → Prisma → MySQL`, with dedicated DTO, model, and enum modules. Routes own URLs/middleware, controllers own HTTP mapping, services enforce business rules, and repositories isolate database queries.
- Database: `User`, `Session`, `Habit`, `HabitEvent`, and `Goal`, UUID IDs, enum fields, foreign keys with dependent-row cascade deletion, unique email, unique session-token hash, and unique habit/date events. Calendar dates use MySQL `DATE`; audit timestamps use `DATETIME(3)`. Optional fields are nullable and goals default to `ACTIVE`.
- Runtime: the backend implements health, authentication/onboarding, habit management, tracking, streak statistics, goals, stateless gamification events, derived user statistics, and dashboard aggregation. Unknown API paths return JSON `404`; browser page routes serve the React shell.

Protected `/app/*` routes require a valid database session and completed onboarding. The public homepage, authentication, onboarding, and `/brand-kit` routes remain accessible outside the product shell.

## Authentication API

Authentication uses an opaque `habit_session` cookie. Passwords are hashed with bcrypt. Session tokens are generated with a cryptographically secure random source, while only their SHA-256 hashes are stored in MySQL. Logout deletes the current database session immediately. Login errors never reveal whether an email exists, and register/login endpoints are rate limited per IP.

```text
POST  /api/auth/register    { email, password, timezone }
POST  /api/auth/login       { email, password }
POST  /api/auth/logout
GET   /api/auth/me
PATCH /api/auth/onboarding  { completed: true }
```

Use a cookie jar when testing manually:

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"correct horse battery staple","timezone":"Asia/Jakarta"}' http://localhost:3000/api/auth/register
curl -i -b cookies.txt http://localhost:3000/api/auth/me
curl -i -b cookies.txt -X PATCH -H "Content-Type: application/json" -d '{"completed":true}' http://localhost:3000/api/auth/onboarding
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

## Habit, statistics, goal, and dashboard APIs

All endpoints below require the `habit_session` cookie:

```text
GET    /api/habits
POST   /api/habits                              { name, description?, type, startDate }
GET    /api/habits/:habitId
PATCH  /api/habits/:habitId                     { name?, description?, type?, startDate? }
DELETE /api/habits/:habitId

PUT    /api/habits/:habitId/completions/:date   { note? }
DELETE /api/habits/:habitId/completions/:date
PUT    /api/habits/:habitId/relapses/:date      { note? }
DELETE /api/habits/:habitId/relapses/:date
GET    /api/habits/:habitId/statistics

GET    /api/goals
POST   /api/habits/:habitId/goals               { title, targetStreakDays, deadline? }
PATCH  /api/goals/:goalId                       { title?, targetStreakDays?, deadline? }
DELETE /api/goals/:goalId
POST   /api/goals/:goalId/cancel

GET    /api/dashboard
```

Creating a habit returns `meta.gamificationEvents` with `HABIT_CREATED`. Completion and relapse PUT responses use this shape:

```json
{
  "data": { "event": {}, "stats": {}, "goal": null },
  "meta": { "gamificationEvents": [] }
}
```

Gamification events contain only semantic `type`, `level`, identifiers, and numeric context. UI copy and animation remain frontend concerns. Repeating an existing PUT updates its optional note and returns an empty event list. Deleting or correcting a tracking record does not emit a celebration.

Dashboard responses include derived `userStatistics`: `totalBuildCompletions`, `totalGoalsCompleted`, `bestBuildStreak`, `bestBreakStreak`, and `bestOverallStreak`. These values are calculated from current habit events and goals and are not persisted.

Dates use `YYYY-MM-DD`. Habit start dates and events cannot be in the future in the user's stored timezone. BUILD habits accept only completion events; BREAK habits accept only relapse events. PUT event operations are idempotent, and all resource lookup is scoped to the authenticated user.

## Streak behavior

BUILD current streak counts consecutive completion events ending today or yesterday when today is still open. BREAK current streak counts clean days since the most recent relapse, with a relapse today producing a streak of zero. Weekly statistics cover Monday through today in the user's timezone and begin no earlier than the habit start date. Statistics include completion totals, eligible weekly days, missed days, completion rate, and last relapse date. Calculated statistics, user statistics, gamification state, and goal progress are not stored as columns.

Goals require a positive streak target. MySQL enforces at most one active goal per habit with a unique active slot. Reaching the target completes the goal when goals or dashboard data are read; cancelling/completing releases the slot. Deadlines cannot be created or changed to a past date, and overdue state is calculated for active goals.

Feature implementation should use meaningful incremental commits as requested in `plan.md`.
