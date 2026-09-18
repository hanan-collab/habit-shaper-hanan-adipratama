# Habit Shaper

Runnable infrastructure scaffold for [plan.md](plan.md). React + Vite + TypeScript live in `frontend/`; Express + TypeScript + Prisma live in `backend/`. MySQL 8.4 supplies the database. Express serves the React production build and `/api` on one origin; no Nginx or CORS configuration is needed.

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

The optional test service runs both TypeScript checks, Vitest/React Testing Library/Supertest tests, and stack smoke tests. It returns a nonzero exit code on failure. Smoke tests request the actual production HTML/JavaScript and API, then create transactional database fixtures to check all four models and event uniqueness. Fixtures are rolled back, including after assertion failures. No persistent seed users are created.

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

- Frontend: `src/app` contains the shell; `src/features` reserves landing, auth, onboarding, dashboard, habits, and goals. Shared components, libraries, styles, and types have dedicated directories. React Router, TanStack Query, React Hook Form, and Zod are installed for future features.
- Backend: feature-based MVC with a service layer (`route → controller → service → Prisma → MySQL`). Authentication is implemented; remaining feature README placeholders explain future responsibilities. There is no repository layer.
- Database: `User`, `Session`, `Habit`, `HabitEvent`, and `Goal`, UUID IDs, enum fields, foreign keys with dependent-row cascade deletion, unique email, unique session-token hash, and unique habit/date events. Calendar dates use MySQL `DATE`; audit timestamps use `DATETIME(3)`. Optional fields are nullable and goals default to `ACTIVE`.
- Runtime: `GET /api/health` reports database readiness. `/api/auth` implements registration, login, logout, current-user lookup, and onboarding completion. Unknown API paths return JSON `404`; browser page routes serve the React shell.

Habit/goal ownership checks, CRUD, event-type compatibility, positive goal target validation, one-active-goal enforcement, streak calculations, frontend auth screens, and protected frontend routes remain unimplemented.

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

## Intended streak behavior (future implementation)

As defined in `plan.md`, BUILD habits record daily COMPLETED events; BREAK habits record RELAPSED events, with no relapse meaning the user remains clean. At most one event is stored per habit/calendar date. Future services must use the user's timezone, calculate current/longest streak and weekly statistics, and derive optional consecutive-day goal progress without persisting calculated columns. Deadline handling and exact date-boundary behavior will be resolved during feature implementation.

Feature implementation should use meaningful incremental commits as requested in `plan.md`.
