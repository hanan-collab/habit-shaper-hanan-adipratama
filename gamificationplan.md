# Habit Shaper Gamification Plan

## 1. Goal

Gamification membantu user merasakan progress tanpa mengubah Habit Shaper menjadi game penuh XP, coins, badges, atau leaderboard.

Principles:

- Reward consistency, not perfection.
- Make small progress visible.
- Use stronger celebration only for meaningful milestones.
- Treat relapse and missed days as recovery moments, not punishment.
- Keep backend semantic and frontend expressive.

## 2. Technical Decision

- No achievement database model.
- No stored user-stat model.
- `GamificationService` is stateless and action-specific.
- `UserStatsService` derives aggregate stats from existing records.
- Backend returns semantic event types and numeric context.
- Frontend owns copy selection, randomization, typography, animation, and visual priority.
- GET dashboard/detail does not produce milestone overlays.

## 3. Response Levels

| Level       | Presentation                        |                 Typical duration |
| ----------- | ----------------------------------- | -------------------------------: |
| `MICRO`     | Button response, toast, count-up    |                        400-800ms |
| `PROGRESS`  | Banner, expanded card, status stamp |                   1-2s or inline |
| `MILESTONE` | Dismissible Monument overlay        |                  Until dismissed |
| `RECOVERY`  | Calm inline panel                   | Persistent until context changes |

## 4. Backend Event Catalog

| Event                 | Trigger                                           | Level                 | Required data                         |
| --------------------- | ------------------------------------------------- | --------------------- | ------------------------------------- |
| `HABIT_CREATED`       | New habit successfully created                    | `PROGRESS`            | `habitId`, `habitType`                |
| `FIRST_CHECK_IN`      | First tracking event for BUILD habit              | `PROGRESS`            | `habitId`, `value=1`                  |
| `DAILY_COMPLETION`    | New BUILD completion created                      | `MICRO`               | `habitId`, `value=currentStreak`      |
| `STREAK_STARTED`      | Current streak changes `0 -> 1`                   | `PROGRESS`            | `habitId`, `value=1`                  |
| `STREAK_MILESTONE`    | Current streak equals 3, 7, 14, 30, 60, or 100    | `MILESTONE`           | `habitId`, `value`                    |
| `PERSONAL_BEST`       | Habit streak exceeds its previous longest streak  | `MICRO` or `PROGRESS` | `habitId`, `value`                    |
| `GOAL_HALFWAY`        | Progress crosses from below 50% to at least 50%   | `PROGRESS`            | `goalId`, `value`, `target`           |
| `GOAL_NEARLY_REACHED` | Goal has one consecutive day remaining            | `PROGRESS`            | `goalId`, `value`, `target`           |
| `GOAL_COMPLETED`      | Goal status transitions `ACTIVE -> COMPLETED`     | `MILESTONE`           | `goalId`, `target`                    |
| `PERFECT_WEEK`        | All seven eligible days completed at week end     | `MILESTONE`           | `habitId`, `value=7`                  |
| `RELAPSE_RECORDED`    | New relapse event created                         | `RECOVERY`            | `habitId`, `previousValue`, `value=0` |
| `COMEBACK`            | New completion after configured inactivity period | `PROGRESS`            | `habitId`, `daysAway`                 |

Derived dashboard messages are not backend gamification events:

- `CLEAN_STREAK_INLINE`
- `MISSED_DAY`
- `STREAK_AT_RISK`
- `WEEKLY_REVIEW`

## 5. Randomized Response Strategy

Copy catalog lives in frontend:

```ts
type CopyVariant = {
  headline: string;
  message: string;
  action?: string;
};

type GamificationCopyCatalog = Record<GamificationEventType, CopyVariant[]>;
```

Rules:

1. Select from variants that match the event type.
2. Do not repeat the immediately previous variant for the same event type in the same browser session.
3. Store only the last variant index in `sessionStorage`; this is presentation state, not product truth.
4. For derived dashboard messages, use deterministic selection based on `eventType + habitId + localDate` to prevent copy changing on every re-render.
5. Never randomize numeric values, goal target, streak value, or tone level.
6. Recovery events may only choose recovery-safe variants.

Example selector:

```ts
function selectCopyVariant(event: GamificationEvent, variants: CopyVariant[]): CopyVariant {
  const key = `gamification-copy:${event.type}`;
  const previous = Number(sessionStorage.getItem(key));
  const candidates = variants.map((variant, index) => ({ variant, index })).filter(({ index }) => index !== previous);

  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  sessionStorage.setItem(key, String(selected.index));
  return selected.variant;
}
```

## 6. Response Copy Bank

All product copy is in English to match the coding-test application.

### HABIT_CREATED

1. `HABIT SHAPED.` — `Your next step is ready.`
2. `A NEW STEP.` — `Start small. Keep it moving.`
3. `READY TO MOVE.` — `This habit begins with the next action.`

Visual: raised Step logo moves up once. No full-screen overlay.

### FIRST_CHECK_IN

1. `FIRST STEP.` — `You showed up today.`
2. `DAY ONE. DONE.` — `A pattern starts with one action.`
3. `MOMENTUM BEGINS.` — `One day can become another.`

Visual: stamped `01`, one logo step lights up.

### DAILY_COMPLETION

1. `DAY {value} LOCKED IN.` — `{habitName} completed.`
2. `TODAY: SHAPED.` — `Another action added to the pattern.`
3. `STEP ADDED.` — `Your streak is now {value} days.`
4. `{value} DAYS. STILL MOVING.` — `Keep the next action simple.`

Visual: button presses down, card rises, streak counts up.

### STREAK_STARTED

1. `MOMENTUM STARTED.` — `Day one is in place.`
2. `THE STREAK BEGINS.` — `Come back for the next step.`
3. `ONE DAY BUILT.` — `Small, but real.`

Visual: first segment of the progress line becomes solid.

### STREAK_MILESTONE

1. `{value} DAYS. BUILT.` — `Small actions became visible progress.`
2. `{value} DAYS. UNBROKEN.` — `You kept showing up.`
3. `{value} DAYS. STILL MOVING.` — `Consistency is taking shape.`
4. `MILESTONE: {value}.` — `One day at a time got you here.`

Action alternatives:

- `KEEP GOING`
- `SHAPE THE NEXT DAY`
- `CONTINUE`

Visual: Monument overlay, large number, white raised logo on deep red.

### PERSONAL_BEST

1. `NEW PERSONAL BEST.` — `{value} consecutive days.`
2. `YOUR LONGEST YET.` — `The new mark is {value} days.`
3. `NEW HIGH MARK.` — `You moved beyond your previous best.`
4. `RECORD SHAPED.` — `{value} days and counting.`

Visual: compact `PB` stamp. Use overlay only when personal best also matches a configured milestone.

### GOAL_HALFWAY

1. `HALFWAY THERE.` — `{value} of {target} days completed.`
2. `50% SHAPED.` — `The next half starts today.`
3. `MIDPOINT REACHED.` — `Your goal is taking form.`

Visual: progress passes a clear midpoint marker; no modal.

### GOAL_NEARLY_REACHED

1. `ONE MORE DAY.` — `Your goal is within reach.`
2. `THE NEXT DAY DOES IT.` — `{value} of {target} days complete.`
3. `ALMOST SHAPED.` — `One more consecutive day.`

Visual: target number outlined; current number filled.

### GOAL_COMPLETED

1. `GOAL SHAPED.` — `You reached a {target}-day streak.`
2. `TARGET REACHED.` — `{target} consecutive days. The habit continues.`
3. `{target} DAYS. DONE.` — `The milestone is complete. Keep the pattern alive.`
4. `YOU BUILT THIS.` — `{target} days of repeated action.`

Action alternatives:

- `CONTINUE THE STREAK`
- `KEEP SHAPING`
- `RETURN TO DASHBOARD`

Visual: highest-priority Monument overlay.

### PERFECT_WEEK

1. `FULL WEEK.` — `You showed up every eligible day.`
2. `7/7. COMPLETE.` — `Every day this week is accounted for.`
3. `EVERY DAY. DONE.` — `A complete week of consistency.`

Visual: seven blocks become solid from left to right.

### RELAPSE_RECORDED

1. `RESET RECORDED.` — `Your clean streak restarts tomorrow. Your progress still counts.`
2. `A NEW START BEGINS.` — `The previous streak remains part of your progress.`
3. `TODAY IS DATA.` — `Record it honestly, then shape the next choice.`
4. `RESET. NOT ERASED.` — `One relapse does not remove what you learned.`

Action alternatives:

- `CONTINUE`
- `RETURN TO TODAY`
- `START THE NEXT STEP`

Visual: blush recovery panel. No shake, broken icon, loss sound, or celebratory overlay.

### COMEBACK

1. `BACK IN MOTION.` — `The next step matters more than the gap.`
2. `WELCOME BACK.` — `Start again with one action.`
3. `THE NEXT STEP COUNTS.` — `Progress can restart today.`
4. `MOVING AGAIN.` — `You returned. That matters.`

Visual: Step logo restarts from the first level.

## 7. Derived Dashboard Copy

These messages are calculated from dashboard state and do not enter `meta.gamificationEvents`.

### CLEAN_STREAK_INLINE

1. `{value} DAYS CLEAR.` — `Keep shaping the distance.`
2. `CLEAR: DAY {value}.` — `Another clean day in progress.`
3. `{value} DAYS OF DISTANCE.` — `The pattern is changing.`

### MISSED_DAY

1. `NEXT DAY. NEW STEP.` — `One missed day doesn’t erase your progress.`
2. `BEGIN AGAIN TODAY.` — `The previous days still count.`
3. `ONE DAY MISSED. NOT EVERYTHING.` — `Take the next available step.`

### STREAK_AT_RISK

1. `KEEP IT ALIVE.` — `{habitName} is still open today.`
2. `TODAY IS STILL OPEN.` — `One action keeps the streak moving.`
3. `ONE STEP LEFT TODAY.` — `Complete it when you’re ready.`

### WEEKLY_REVIEW

1. `{rate}% THIS WEEK.` — `{completed} completed. {missed} missed.`
2. `WEEK IN REVIEW.` — `You showed up on {completed} of {eligible} days.`
3. `{completed} DAYS SHAPED.` — `Use what worked in the next week.`

## 8. Functional Responses Without Gamification

| Action             | Response                                               |
| ------------------ | ------------------------------------------------------ |
| Completion removed | `Completion removed.`                                  |
| Relapse removed    | `Record corrected. Your streak has been recalculated.` |
| Habit updated      | `Habit updated.`                                       |
| Goal updated       | `Goal updated.`                                        |
| Habit deleted      | `Habit deleted.`                                       |
| Goal deleted       | `Goal deleted.`                                        |
| Validation error   | Specific validation message                            |
| Server error       | Actionable error with retry option                     |

These responses do not use large type, milestone overlay, or random celebratory copy.

## 9. Event Collision Priority

When one action returns multiple events:

```text
1. GOAL_COMPLETED
2. STREAK_MILESTONE
3. PERFECT_WEEK
4. PERSONAL_BEST
5. GOAL_HALFWAY / GOAL_NEARLY_REACHED
6. DAILY_COMPLETION
```

Rules:

- Render a maximum of one `MILESTONE` overlay.
- Convert secondary milestone/progress events into compact stamps or toast messages.
- Never stack multiple modals.
- Recovery response always replaces celebration for the same action.

## 10. Required Statistics

### Habit statistics

| Stat                   | Used by                                    |
| ---------------------- | ------------------------------------------ |
| `currentStreak`        | Daily completion, milestone, goal progress |
| `longestStreak`        | Personal best                              |
| `totalCompletions`     | First check-in                             |
| `completedThisWeek`    | Perfect week and weekly review             |
| `missedThisWeek`       | Weekly review                              |
| `eligibleDaysThisWeek` | Correct weekly denominator                 |
| `weeklyCompletionRate` | Weekly review                              |
| `lastRelapseDate`      | BREAK recovery and clean streak            |

### Goal statistics

| Stat                       | Used by                            |
| -------------------------- | ---------------------------------- |
| `currentProgress`          | Halfway and near-completion events |
| `targetStreakDays`         | Goal progress and completion copy  |
| `percentage`               | Halfway crossing                   |
| `remainingDays`            | Near-completion event              |
| `statusBefore/statusAfter` | Goal-completion transition         |

### User statistics

Calculated by `UserStatsService`:

```text
totalBuildCompletions
totalGoalsCompleted
bestBuildStreak
bestBreakStreak
bestOverallStreak
```

These stats are dashboard/profile summaries, not gamification database state.

## 11. Visual Response Mapping

| Level       | Monument treatment                                               |
| ----------- | ---------------------------------------------------------------- |
| `MICRO`     | Raised button press, count-up, compact stamp                     |
| `PROGRESS`  | Expanded card or horizontal deep-red banner                      |
| `MILESTONE` | Full deep-red overlay, large condensed number, white raised logo |
| `RECOVERY`  | Warm-white/blush panel with calm supporting copy                 |

## 12. Accessibility and Motion

- All messages remain readable without animation.
- Respect `prefers-reduced-motion`.
- Do not autoplay audio.
- Maintain keyboard focus when overlays open and close.
- Provide a visible dismiss button.
- Do not use color as the only indicator.
- Copy randomness must never change the meaning or severity of a response.

## 13. MVP Scope

Implement first:

- `HABIT_CREATED`
- `FIRST_CHECK_IN`
- `DAILY_COMPLETION`
- `STREAK_MILESTONE`
- `PERSONAL_BEST`
- `GOAL_COMPLETED`
- `PERFECT_WEEK`
- `RELAPSE_RECORDED`
- Derived clean streak, missed-day, and weekly-review messages

Optional after core completion:

- `GOAL_HALFWAY`
- `GOAL_NEARLY_REACHED`
- `COMEBACK`
- Advanced motion variants

## 14. Acceptance Criteria

- Repeating an idempotent action does not replay a celebration.
- Copy does not repeat immediately for the same event type in one session.
- Refreshing a dashboard does not open milestone overlays.
- A relapse never produces punitive wording or destructive animation.
- Goal completion takes priority over other events.
- Personal best is calculated per habit.
- User stats are derived, not persisted.
- Copy variants preserve identical business meaning.
