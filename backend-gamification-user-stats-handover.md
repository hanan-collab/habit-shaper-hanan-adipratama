# Backend Handover: Gamification and User Statistics

## 1. Purpose

Dokumen ini menjadi acuan implementasi backend untuk:

- `HabitStatsService`
- `UserStatsService`
- `GamificationService`
- Integrasi ketiganya dengan completion, relapse, goal, dan dashboard

Keputusan final untuk MVP:

- Tidak membuat model achievement.
- Tidak membuat model `UserStats`.
- Tidak menambahkan cached statistic pada model `User`.
- Database source of truth tetap `Habit`, `HabitEvent`, dan `Goal`.
- Gamification bersifat stateless dan action-specific.
- Backend mengirim semantic gamification event; copy, typography, dan animation ditentukan frontend.

## 2. Existing Data Model

Model yang digunakan:

```text
User
├── Habit
│   ├── HabitEvent
│   └── Goal
```

### Relevant enums

```ts
enum HabitType {
  BUILD = 'BUILD',
  BREAK = 'BREAK',
}

enum HabitEventType {
  COMPLETED = 'COMPLETED',
  RELAPSED = 'RELAPSED',
}

enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

Required database constraint:

```prisma
@@unique([habitId, date])
@@index([habitId, date])
```

## 3. Service Responsibilities

### HabitStatsService

Menghitung statistik satu habit dari `HabitEvent`:

```ts
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completedThisWeek: number;
  missedThisWeek: number;
  weeklyCompletionRate: number;
  lastRelapseDate?: string;
}
```

Rules:

- `BUILD`: streak berasal dari tanggal `COMPLETED` yang berurutan.
- Jika BUILD belum completed hari ini, streak boleh berakhir kemarin.
- `BREAK`: streak berasal dari jumlah clean days sejak start date atau relapse terakhir.
- Relapse hari ini menghasilkan current streak `0`.
- Future dates dan tanggal sebelum `startDate` tidak dihitung.
- Semua batas tanggal mengikuti timezone user.

### UserStatsService

Mengagregasikan hasil seluruh habit tanpa menyimpan hasilnya ke database:

```ts
export interface UserStats {
  totalBuildCompletions: number;
  totalGoalsCompleted: number;
  bestBuildStreak: number;
  bestBreakStreak: number;
  bestOverallStreak: number;
}
```

Contoh service:

```ts
export class UserStatsService {
  aggregate(habits: HabitWithStats[], totalGoalsCompleted: number): UserStats {
    const build = habits.filter((habit) => habit.type === 'BUILD');
    const breaking = habits.filter((habit) => habit.type === 'BREAK');

    const bestBuildStreak = Math.max(0, ...build.map((habit) => habit.stats.longestStreak));

    const bestBreakStreak = Math.max(0, ...breaking.map((habit) => habit.stats.longestStreak));

    return {
      totalBuildCompletions: build.reduce((total, habit) => total + habit.stats.totalCompletions, 0),
      totalGoalsCompleted,
      bestBuildStreak,
      bestBreakStreak,
      bestOverallStreak: Math.max(bestBuildStreak, bestBreakStreak),
    };
  }
}
```

User-level stats dihitung pada dashboard/profile request, bukan pada setiap completion.

### GamificationService

Pure domain service yang membandingkan state sebelum dan sesudah action.

Service ini tidak:

- Melakukan query database.
- Menulis database.
- Menyimpan copy UI.
- Dipanggil sebagai global middleware.
- Berjalan melalui cron atau background worker.

```ts
export type GamificationAction = 'HABIT_CREATED' | 'BUILD_COMPLETED' | 'BREAK_RELAPSED';

export type GamificationLevel = 'MICRO' | 'PROGRESS' | 'MILESTONE' | 'RECOVERY';

export type GamificationEventType =
  | 'HABIT_CREATED'
  | 'FIRST_CHECK_IN'
  | 'DAILY_COMPLETION'
  | 'STREAK_STARTED'
  | 'STREAK_MILESTONE'
  | 'PERSONAL_BEST'
  | 'GOAL_HALFWAY'
  | 'GOAL_NEARLY_REACHED'
  | 'GOAL_COMPLETED'
  | 'PERFECT_WEEK'
  | 'RELAPSE_RECORDED'
  | 'COMEBACK';

export interface GamificationEvent {
  type: GamificationEventType;
  level: GamificationLevel;
  habitId?: string;
  goalId?: string;
  value?: number;
  target?: number;
  previousValue?: number;
}
```

## 4. Action-Specific Rule Matrix

| Action                  | Rules evaluated                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `HABIT_CREATED`         | Habit-created response only                                                                                     |
| `BUILD_COMPLETED`       | First check-in, daily completion, streak start, milestone, personal best, goal crossing, perfect week, comeback |
| `BREAK_RELAPSED`        | Relapse recovery only                                                                                           |
| Completion removed      | No celebration; recalculate stats                                                                               |
| Relapse removed         | No celebration; recalculate stats                                                                               |
| Goal create/edit/cancel | No celebration                                                                                                  |
| Dashboard/detail GET    | No gamification overlay; derived inline messages only                                                           |

## 5. Build Completion Flow

```text
Controller
-> TrackingService validates ownership and habit type
-> Calculate before stats and active-goal progress
-> Create COMPLETED event
-> If event already existed, return without gamification
-> Calculate after stats
-> Sync goal state
-> GamificationService evaluates BUILD_COMPLETED rules
-> Return data + meta.gamificationEvents
```

Pseudocode:

```ts
async function completeBuildHabit(input: CompleteHabitInput) {
  const habit = await getOwnedHabit(input.userId, input.habitId);

  if (habit.type !== 'BUILD') {
    throw new ValidationError('Only BUILD habits can be completed');
  }

  const before = await habitStatsService.calculate(habit);
  const goalBefore = await goalService.getActiveProgress(habit);

  const result = await habitEventService.createCompletion(input);

  if (!result.created) {
    return {
      data: { event: result.event, stats: before, goal: goalBefore },
      meta: { gamificationEvents: [] },
    };
  }

  const after = await habitStatsService.calculate(habit);
  const goalAfter = await goalService.syncAfterStreakChange(habit, after.currentStreak);

  const gamificationEvents = gamificationService.evaluate({
    action: 'BUILD_COMPLETED',
    habit,
    before,
    after,
    goalBefore,
    goalAfter,
    localDate: input.date,
  });

  return {
    data: { event: result.event, stats: after, goal: goalAfter },
    meta: { gamificationEvents },
  };
}
```

## 6. Relapse Flow

```text
Controller
-> TrackingService validates BREAK habit
-> Calculate clean streak before relapse
-> Create RELAPSED event
-> If event already existed, return without gamification
-> Current streak becomes 0
-> Return RELAPSE_RECORDED recovery event
```

Relapse tidak menjalankan streak milestone, perfect week, atau goal completion rules.

## 7. Gamification Evaluation Rules

Recommended fixed milestones:

```ts
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
```

Important conditions:

```ts
if (!eventCreated) return [];

if (before.totalCompletions === 0) {
  // FIRST_CHECK_IN
}

if (before.currentStreak === 0 && after.currentStreak === 1) {
  // STREAK_STARTED
}

if (STREAK_MILESTONES.has(after.currentStreak)) {
  // STREAK_MILESTONE
}

if (after.currentStreak > before.longestStreak) {
  // PERSONAL_BEST
}

if (goalBefore.percentage < 50 && goalAfter.percentage >= 50) {
  // GOAL_HALFWAY
}

if (goalBefore.status === 'ACTIVE' && goalAfter.status === 'COMPLETED') {
  // GOAL_COMPLETED
}
```

`PERFECT_WEEK` hanya boleh muncul ketika:

- Hari lokal user adalah akhir minggu yang ditentukan aplikasi.
- Semua tujuh hari pada minggu tersebut eligible.
- Semua eligible days completed.

Jangan menganggap `3/3` pada hari Rabu sebagai perfect week.

## 8. API Response Contract

```json
{
  "data": {
    "habitId": "habit-1",
    "stats": {
      "currentStreak": 7,
      "longestStreak": 7,
      "completedThisWeek": 7,
      "missedThisWeek": 0,
      "weeklyCompletionRate": 100
    }
  },
  "meta": {
    "gamificationEvents": [
      {
        "type": "STREAK_MILESTONE",
        "level": "MILESTONE",
        "habitId": "habit-1",
        "value": 7
      },
      {
        "type": "PERSONAL_BEST",
        "level": "PROGRESS",
        "habitId": "habit-1",
        "value": 7
      }
    ]
  }
}
```

Backend tidak mengirim `headline`, `message`, font, warna, atau animation name.

## 9. Event Collision Priority

Frontend menggunakan prioritas berikut:

```text
1. GOAL_COMPLETED
2. STREAK_MILESTONE
3. PERFECT_WEEK
4. PERSONAL_BEST
5. DAILY_COMPLETION
```

Hanya satu milestone overlay ditampilkan. Event lain menjadi badge atau toast setelah overlay ditutup.

## 10. Performance Guardrails

- Jangan melakukan query dari `GamificationService`.
- Jangan melakukan satu query per rule.
- Reuse hasil `HabitStatsService` untuk API response, goal, dan gamification.
- Completion API hanya menghitung habit yang berubah.
- Global `UserStatsService` hanya dijalankan pada dashboard/profile.
- Batch-load habits, events, dan active goals untuk menghindari N+1 query.
- Gunakan `eventCreated` sebagai early return untuk idempotent `PUT` retry.
- Weekly stats hanya membutuhkan date range minggu berjalan.
- Untuk MVP, longest streak boleh dihitung dari history; optimasi cache hanya dilakukan setelah profiling menunjukkan bottleneck.

## 11. Suggested Backend Structure

```text
backend/src/modules/
├── tracking/
│   ├── tracking.controller.ts
│   ├── tracking.routes.ts
│   ├── tracking.schema.ts
│   └── tracking.service.ts
├── stats/
│   ├── habit-stats.service.ts
│   ├── user-stats.service.ts
│   └── stats.types.ts
├── gamification/
│   ├── gamification.config.ts
│   ├── gamification.service.ts
│   └── gamification.types.ts
├── goal/
└── dashboard/
```

## 12. Minimum Tests

### HabitStatsService

- BUILD streak with consecutive dates.
- BUILD streak with a missed date.
- BUILD streak ending yesterday.
- BREAK streak without relapse.
- BREAK streak after relapse.
- Relapse today returns streak `0`.
- Future days are excluded from missed days.
- Dates before `startDate` are excluded.
- Timezone boundaries are respected.

### UserStatsService

- Aggregates total BUILD completions.
- Separates best BUILD and BREAK streak.
- Returns `0` when no habits exist.
- Calculates best overall streak.
- Counts completed goals.

### GamificationService

- Returns no events when `eventCreated` is false.
- Detects first check-in.
- Detects configured milestone.
- Does not trigger milestone on a normal day.
- Detects per-habit personal best.
- Detects goal halfway transition.
- Detects `ACTIVE -> COMPLETED` goal transition.
- Evaluates relapse rules without evaluating BUILD rules.
- Returns deterministic event ordering.

## 13. Acceptance Criteria

- No schema migration is introduced for gamification or user stats.
- Repeating the same completion request produces no duplicate celebration.
- Dashboard stats always match current database records.
- Deleting/correcting an event changes calculated stats automatically.
- Gamification service remains pure and independently unit-testable.
- Frontend can render all responses using only event `type`, `level`, and numeric context.
