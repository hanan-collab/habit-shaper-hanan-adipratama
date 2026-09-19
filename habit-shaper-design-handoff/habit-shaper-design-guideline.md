# Habit Shaper Design Guideline

## 1. Selected Direction

Design direction: **Monument**.

Monument menggabungkan:

- Typography besar, condensed, dan tegas.
- Dominasi putih, deep red, dan soft red.
- Raised rounded-square surfaces.
- Komposisi sederhana dengan hierarchy kuat.
- Gamification yang terasa premium, bukan childish.

Brand essence:

```text
Calm momentum.
```

Primary promise:

```text
Small actions. Visible progress.
```

Primary message:

```text
Build what helps. Break what holds you back.
```

## 2. Brand Personality

Habit Shaper harus terasa:

- Bold
- Direct
- Professional
- Calm
- Encouraging
- Honest
- Progress-oriented

Habit Shaper tidak boleh terasa:

- Childish
- Noisy
- Aggressive
- Punitive
- Overly playful
- Corporate-generic
- Productivity-hustle oriented

## 3. Logo System

Logo direction: **The Step**.

Logo terdiri dari:

- Rounded-square white tile.
- Soft-red border.
- Deep-red bottom extrusion/shadow.
- Tiga rounded horizontal steps yang bergerak naik.

Makna:

```text
One small action
-> repeated action
-> visible progress
```

### Logo proportions

- Outer shape: square dengan radius sekitar 22-25% dari ukuran.
- Border: 3-4% dari ukuran logo.
- Raised bottom edge: 6-8% dari ukuran logo.
- Clear space minimum: setengah lebar logo pada semua sisi.
- Jangan menambahkan atom, flame, trophy, atau checkmark ke dalam logo.

### Logo variants

1. Primary: white face, soft-red border, deep-red raised edge.
2. Inverted: white face and border di atas deep-red background.
3. Monochrome: warm ink untuk kebutuhan print satu warna.

## 4. Color Palette

| Token | Hex | Primary use |
|---|---|---|
| Warm white | `#FFF8F6` | Main background |
| Pure white | `#FFFFFF` | Cards, raised faces, inverted text |
| Soft red | `#E67A72` | Brand accent, progress, decorative type |
| Blush | `#F8DEDB` | Supportive and recovery surfaces |
| Deep red | `#A93F3B` | Primary CTA, dark brand surface, accessible emphasis |
| Warm ink | `#261F1F` | Main body and heading text |
| Soft border | `#DFB7B3` | Borders and separators |

### Usage ratio

Recommended composition:

```text
60% warm/pure white
25% deep red or warm ink
15% soft red and blush accents
```

### Accessibility rules

- Gunakan `#A93F3B` untuk button dengan white text.
- Jangan gunakan soft red untuk small body text di atas white.
- Soft red boleh digunakan untuk large display text, icons, borders, dan decorative elements.
- Recovery state menggunakan blush, bukan bright error red.
- Jangan mengandalkan warna saja; sertakan label, icon, atau status text.

## 5. Typography

### Display typeface

```text
Barlow Condensed
Weights: 700, 800, 900
```

Digunakan untuk:

- Hero headline.
- Milestone numbers.
- Gamification overlay.
- Poster and marketing statement.
- Short uppercase status.

Display typography harus pendek dan tegas:

```text
07 DAYS.
STILL MOVING.

GOAL SHAPED.

RESET RECORDED.
```

### UI and body typeface

```text
Space Grotesk
Weights: 400, 500, 600, 700
```

Digunakan untuk:

- Navigation.
- Paragraphs.
- Button labels.
- Forms.
- Table and chart labels.
- Supporting gamification copy.

### Typography hierarchy

| Role | Typeface | Weight | Suggested size |
|---|---|---:|---:|
| Marketing display | Barlow Condensed | 900 | 72-112px desktop |
| Page title | Barlow Condensed | 800 | 48-64px |
| Milestone number | Barlow Condensed | 900 | 96-160px |
| Section heading | Barlow Condensed | 800 | 32-44px |
| Card heading | Space Grotesk | 700 | 18-22px |
| Body | Space Grotesk | 400 | 16px |
| Button | Space Grotesk | 700 | 14-16px |
| Label | Space Grotesk | 700 | 11-12px uppercase |

Avoid long paragraphs in Barlow Condensed.

## 6. Layout System

### General composition

- Use a strict grid.
- Make one element dominant per screen.
- Use asymmetric composition for marketing pages.
- Use aligned, quieter composition inside the app.
- Prefer whitespace over extra decorative cards.
- Avoid excessive centered layouts outside milestone overlays.

### Spacing scale

```text
4, 8, 12, 16, 24, 32, 48, 64, 96
```

### Border radius

```text
Input/button: 10-12px
Standard card: 16px
Feature card: 20-24px
Logo/app icon: 22-25% of size
```

## 7. Raised Surface Style

Raised treatment adalah identitas utama, tetapi harus dipakai selektif.

Recommended CSS direction:

```css
.raised-primary {
  background: #a93f3b;
  color: #ffffff;
  border: 1px solid #7f2f2c;
  border-radius: 12px;
  box-shadow: 0 5px 0 #7f2f2c;
}

.raised-card {
  background: #ffffff;
  border: 1px solid #dfb7b3;
  border-radius: 20px;
  box-shadow: 0 7px 0 rgba(169, 63, 59, 0.14);
}
```

Rules:

- Raised effect dipakai untuk CTA, logo, active habit, dan milestone.
- Static text sections tidak perlu shadow.
- Maksimal satu dominant raised CTA per section.
- Jangan memakai blur shadow berlebihan.
- Bottom extrusion harus terlihat solid, bukan glossy.

## 8. Component Direction

### Buttons

Primary:

- Deep-red fill.
- White text.
- Solid bottom extrusion.
- Moves down 2-3px when pressed.

Secondary:

- White fill.
- Deep-red border and text.
- Smaller raised edge or no raised edge.

Destructive/delete:

- Plain text or outline.
- Jangan memakai gamification treatment.

### Habit cards

BUILD:

- White card.
- Soft-red progress accent.
- Strong current-streak number.
- Raised completion button.

BREAK:

- White or blush card.
- Clean streak becomes dominant number.
- Report relapse remains visually secondary.
- Relapse button must not look like a primary success action.

### Goal progress

- Use one solid progress fill.
- Current value and target must be directly labeled.
- Avoid decorative border around the progress track.
- Goal completion may use full Monument overlay.

## 9. Gamification Visual Language

### Micro response

- Duration: 400-800ms.
- Button press and release.
- Number count-up.
- One step of the logo lights up.
- No confetti.

### Progress response

- Bold banner or expanded card.
- Large number with short headline.
- Duration: 1-2 seconds or dismissible inline state.

### Milestone response

- Deep-red full surface.
- White raised logo.
- Large Barlow Condensed number.
- One clear CTA.
- User dismisses the overlay.

### Recovery response

- Warm white or blush background.
- No shake animation.
- No broken or falling icons.
- No loss sound.
- Previous progress may remain visible.

## 10. Motion Principles

- Motion communicates state change, not decoration.
- Use transform and opacity; avoid complex path animations.
- Standard transition: 180-240ms.
- Milestone sequence: maximum 900ms before content is stable.
- Respect `prefers-reduced-motion`.
- Do not loop celebration animation.
- Do not autoplay sound.

Recommended interaction:

```text
Button press
-> tile lowers
-> event succeeds
-> tile rises
-> number increments
-> optional milestone expands
```

## 11. Voice and Tone

Voice is direct, concise, and supportive.

Use:

```text
DAY 7 LOCKED IN.
Small actions became visible progress.

RESET RECORDED.
Your progress still counts.
```

Avoid:

```text
You failed.
Streak destroyed.
Try harder.
No excuses.
```

Headline should normally contain 2-6 words. Supporting copy may contain one or two short sentences.

## 12. Homepage Application

Recommended hero structure:

```text
Eyebrow: SMALL ACTIONS / VISIBLE PROGRESS

Headline:
BUILD WHAT HELPS.
BREAK WHAT HOLDS YOU BACK.

Supporting copy:
Track daily actions, understand your streaks,
and begin again when life gets in the way.

CTA: START WITH ONE HABIT
```

Use:

- Large left-aligned headline.
- Raised The Step logo or product card on the right.
- Warm-white background with deep-red blocks.
- One dominant CTA.
- Actual product preview rather than generic lifestyle imagery.

## 13. Do and Don't

### Do

- Use bold hierarchy.
- Use numbers as visual anchors.
- Keep copy short.
- Use raised effects for meaningful interaction.
- Keep recovery language calm.
- Let white space preserve professionalism.

### Don't

- Use confetti on every completion.
- Add XP, coins, or cartoon badges.
- Use bright red for relapse shame.
- Put every item inside a raised card.
- Combine several display fonts.
- Use soft red for inaccessible small text.
- Use aggressive discipline language.

## 14. Asset Architecture

Semua reusable brand artifact harus tersimpan bersama frontend:

```text
public/
└── brand/
    ├── logo/
    ├── icons/
    ├── patterns/
    ├── illustrations/
    └── motion/
```

Route `/brand-kit` menjadi preview resmi dan katalog download. Jangan memakai
HTML preview terpisah yang bergantung pada relative local paths.

### Asset ownership

- Logo, icon, pattern, illustration, dan motion menggunakan SVG.
- Copy, angka, CTA, dan label tetap menjadi HTML/React.
- Jangan menanam typography ke dalam animated SVG.
- UI menentukan posisi copy di atas atau di samping motion asset.
- Semua motion assets wajib tetap terbaca ketika `prefers-reduced-motion` aktif.

## 15. Motion Asset Specification

### Rounded flame

Active streak flame harus memiliki:

- Siluet bawah yang lebar dan membulat.
- Ujung atas pendek; hindari bentuk tajam dan agresif.
- Satu inner flame berbentuk rounded drop.
- Deep red outer shape, blush inner shape, deep-red-dark outline.
- Transparent canvas.
- Loop 1.6–1.8 detik.
- Gerakan vertikal maksimum 3px.

Flame hanya digunakan untuk active streak atau personal best. Flame tidak boleh
menjadi logo, error indicator, atau dekorasi berulang di seluruh halaman.

### Completion response

```text
tile lowers
-> tile rises
-> three steps light up
-> check appears
-> animation stops
```

- Durasi 500–700ms.
- One-shot.
- Transparent canvas.
- Tanpa headline, angka, atau label.
- Diputar hanya setelah mutation berhasil.

### Milestone response

```text
deep-red surface expands
-> raised mark enters
-> steps light up
-> accent line completes
-> animation stops
```

- Stabil dalam maksimum 900ms.
- Tanpa embedded copy.
- UI overlay menampilkan milestone number, headline, supporting copy, dan CTA.
- Milestone tidak diputar saat normal page load.

### Recovery

- Motion atau illustration tidak boleh menunjukkan benda pecah atau jatuh.
- Previous progress tetap terlihat.
- Gunakan path yang terputus sebentar lalu berlanjut.
- Tidak ada shake, loss sound, atau bright error red.

## 16. Background and Separator System

Separator bukan sekadar horizontal rule. Separator harus membantu pengguna
merasakan perubahan tahap.

### Momentum band

Digunakan antara Hero dan The Method:

- Deep-red full-width background.
- Dua short brand statements.
- Tiga rounded blocks yang naik.
- Blocks bergerak sekali ketika masuk viewport.
- Copy tetap menjadi elemen dominan.

### Progress spine

Digunakan di The Method:

- Tiga raised numbered nodes.
- Vertical rail blush dengan deep-red fill.
- Step aktif dapat memiliki blush background.
- Icon/motion berada di sisi berlawanan dari copy.
- Mobile mempertahankan rail vertikal dan menyembunyikan decorative preview.

### Stepped transition

Digunakan antara The Method dan Recovery:

- Tiga solid blocks dengan tinggi bertahap.
- Mengubah background warm white menjadi warm ink.
- Tidak menggunakan blur atau diagonal glossy shapes.

### Background sequence

Recommended homepage sequence:

```text
Hero              warm white
Momentum band     deep red
The Method        warm white + blush active step
Recovery          warm ink + blush split
Final CTA         warm white
```

Jangan menampilkan lebih dari dua background dekoratif dalam satu viewport.

## 17. Progress UI System

### Linear progress

Gunakan untuk bounded target seperti `18 / 30 days`.

- Gunakan accessible Progress primitive.
- Track: blush.
- Fill: deep red.
- Height: 6–10px.
- Radius: fully rounded.
- Current dan target selalu ditulis.
- Sertakan remaining value ketika membantu keputusan user.

### Circular progress

Gunakan hanya untuk persentase completion:

- Weekly completion.
- Monthly completion.
- Goal completion rate.

Circular progress tidak digunakan untuk streak karena streak tidak memiliki
stable maximum.

### Number ticker

Gunakan ketika nilai berubah karena user action:

- Current streak.
- Personal best.
- Completion rate.
- Total completed days.

Rules:

- Durasi 500–800ms.
- Tidak mengulang setiap component rerender.
- Reduced-motion langsung menampilkan final value.
- Jangan menganimasikan angka yang tidak berubah.

## 18. Homepage Handover

### Page objective

Membantu user memahami bahwa Habit Shaper melacak aksi kecil, menunjukkan
momentum, dan tetap mendukung ketika terjadi reset.

### Section order

1. Navigation.
2. Hero with interactive product preview.
3. Momentum band.
4. The Method / Progress Spine.
5. Recovery statement.
6. Final CTA.
7. Footer.

### Hero

- Left: eyebrow, animated action word, message, primary CTA.
- Right: actual habit interface preview.
- Product preview boleh interaktif untuk menunjukkan completion response.
- Maksimal satu floating gamification chip.

### The Method

```text
01 Set the direction — Choose the action
02 Make it visible — Show up today
03 Learn the pattern — See the shape form
```

Gunakan Progress Spine sebagai selected direction. Hindari tiga generic cards
yang dipisahkan garis tipis.

### Recovery

- Split background: warm ink dan blush.
- Headline utama: `A RESET IS DATA. NOT A VERDICT.`
- Supporting stats tetap memperlihatkan total progress.
- Relapse/reset bukan primary success CTA.

## 19. Onboarding Page Handover

### Objective

Membawa user dari intent menuju habit pertama tanpa mewajibkan goal.

### Flow

1. Welcome and promise.
2. Choose BUILD or BREAK.
3. Name the action.
4. Choose schedule/frequency.
5. Optional goal and target.
6. Confirm timezone.
7. Review and start.

### Layout

- One decision per screen.
- Progress indicator menunjukkan step dan label.
- Back button selalu tersedia.
- Right panel dapat memakai step pattern atau motion asset.
- Final confirmation memakai completion response, bukan confetti.

### BUILD and BREAK

- BUILD memakai white surface dan deep-red primary CTA.
- BREAK memakai blush supporting surface.
- BREAK copy tidak boleh terdengar menghukum.

## 20. Dashboard Page Handover

### First viewport

- Greeting/date.
- Today completion summary.
- Today habit list.
- One quick action per habit.

### Habit cards

BUILD:

- Habit title.
- Current streak.
- Schedule.
- Complete button.

BREAK:

- Habit title.
- Clean streak.
- Schedule.
- Report relapse sebagai secondary action.

### Supporting sections

- Weekly completion menggunakan circular progress.
- Current streak dan personal best menggunakan Number Ticker setelah mutation.
- Goal preview menggunakan linear progress.
- Gamification event muncul setelah API action, bukan ketika dashboard dibuka.

## 21. Habit Detail Page Handover

### Header

- Habit name and BUILD/BREAK label.
- Current streak as dominant number.
- Edit action secondary.

### Main content

- Check-in or relapse action.
- Calendar/history.
- Current streak and personal best.
- Weekly/monthly completion.
- Attached active goal, jika ada.

### Motion

- Completion asset dimainkan setelah successful BUILD check-in.
- Rounded flame hanya ditampilkan ketika current streak aktif.
- Relapse menggunakan recovery response tanpa loss animation.

## 22. Goals Page Handover

### Goals overview

- Active goals first.
- Goal title, habit relationship, current value, target, optional deadline.
- Linear progress dengan explicit current/target label.
- Completed goals terpisah dan visually quieter.

### Goal detail

- Goal statement.
- Associated habit.
- Consecutive streak target.
- Current progress.
- Deadline jika tersedia.
- Timeline of meaningful progress.

Ketika goal selesai, gunakan milestone surface dengan overlay copy dari frontend.

## 23. Statistics Page Handover

### Hierarchy

1. Completion rate.
2. Current streak.
3. Personal best.
4. Completed/missed days.
5. Weekly or monthly trend.

### Visualization

- Circular progress untuk completion percentage.
- Large number ticker untuk changed headline stats.
- Bar/line chart untuk trend.
- Semua chart memiliki direct labels dan text summary.
- Jangan mengandalkan tooltip sebagai satu-satunya sumber nilai.

## 24. Profile and Settings Handover

- Account identity.
- Timezone.
- Notification preferences jika fitur tersedia.
- Onboarding state.
- Data/delete actions.

Settings menggunakan composition yang tenang:

- No gamification overlays.
- No raised treatment untuk destructive action.
- Group fields dengan spacing dan heading, bukan banyak decorative cards.

## 25. Brand Kit Page Handover

Route: `/brand-kit`.

Isi:

1. Logo variants.
2. Functional icons.
3. Motion assets.
4. Linear, circular, and number progress examples.
5. Step pattern.
6. Recovery illustration.
7. Download action untuk setiap SVG.

Brand Kit memakai typography dan palette yang sama, tetapi tidak menjadi bagian
dari primary end-user navigation setelah product masuk production.

## 26. Responsive and Accessibility Checklist

- Main body text minimum 16px.
- Interactive labels minimum 14px.
- Touch target minimum 44×44px.
- Headline tidak boleh terpotong pada 320px viewport.
- Product preview tidak menyebabkan horizontal scrolling.
- Navigation dapat menyederhanakan link pada mobile.
- Semua meaningful images memiliki alt text.
- Decorative SVG memakai empty alt.
- Progress memiliki accessible value.
- Copy tetap terbaca tanpa animation.
- Seluruh animation menghormati `prefers-reduced-motion`.

## 27. Scope and Source of Truth

Dokumen ini adalah handoff desain utama untuk MVP Habit Shaper. Implementasi
frontend harus mengikuti dokumen ini untuk visual, component behavior, page
logic, UI state, animation, dan interaction. Dokumen backend tetap menjadi
referensi untuk persistence dan API contract.

### Product scope

Halaman yang termasuk dalam handoff:

1. Public homepage.
2. Onboarding.
3. Dashboard / Today.
4. Habits overview.
5. Create and edit habit.
6. Habit detail.
7. Goals overview.
8. Create and edit goal.
9. Goal detail.
10. Statistics.
11. Profile and settings.
12. Brand Kit.

Authentication screen boleh memakai visual language yang sama, tetapi bukan
fokus utama coding test kecuali diminta secara eksplisit.

### Core product principles

- User dapat membuat habit tanpa membuat goal.
- Habit merupakan sumber check-in, streak, completion, dan relapse.
- Goal adalah optional finish line yang menempel pada satu habit.
- Personal best dan aggregate statistic dihitung oleh service, bukan menjadi
  source of truth terpisah di frontend.
- Gamification merespons perubahan state yang sudah berhasil, bukan menebak
  hasil sebelum API selesai.
- Recovery mempertahankan histori, personal best, dan total completion.

## 28. Complete Artifact Manifest

Semua artifact tetap menggunakan visual direction **Monument**. File motion
tidak mengandung copy; teks selalu di-render oleh UI agar dapat diakses,
diterjemahkan, dan diubah tanpa mengedit SVG.

### Logo

| Artifact | Path | Usage |
|---|---|---|
| The Step Primary | `public/brand/logo/the-step-primary.svg` | Navbar, app shell, light surface |
| The Step Inverted | `public/brand/logo/the-step-inverted.svg` | Deep-red or warm-ink surface |
| The Step Monochrome | `public/brand/logo/the-step-monochrome.svg` | Print and single-color export |

### Functional icons

| Artifact | Path | Primary usage |
|---|---|---|
| Build | `public/brand/icons/build.svg` | BUILD selector and habit label |
| Break | `public/brand/icons/break.svg` | BREAK selector and habit label |
| Complete | `public/brand/icons/complete.svg` | Completed check-in |
| Relapse | `public/brand/icons/relapse.svg` | Record reset / relapse |
| Goal | `public/brand/icons/goal.svg` | Goal relationship |
| Statistics | `public/brand/icons/statistics.svg` | Trend and insight navigation |
| Personal best | `public/brand/icons/personal-best.svg` | Personal-best statistic |
| Streak | `public/brand/icons/streak.svg` | Current streak statistic |

### Motion and supporting artwork

| Artifact | Path | Trigger | Loop |
|---|---|---|---|
| Rounded active flame | `public/brand/motion/flame-active.svg` | Active streak is shown | Yes, subtle |
| Completion response | `public/brand/motion/completion-success.svg` | Check-in mutation succeeds | No |
| Milestone response | `public/brand/motion/milestone-day-7.svg` | Milestone evaluator returns event | No |
| Step grid | `public/brand/patterns/step-grid.svg` | Quiet background / empty state | No |
| Recovery progress | `public/brand/illustrations/recovery-progress.svg` | Recovery education or reset result | No |

### Rules for adding artifacts

- Use the existing functional icon language before adding new icons.
- New icons use 24×24 artboard, 2.25 stroke, round cap, and round join.
- New motion assets must have transparent canvas and no embedded text.
- Product screenshots are content, not brand assets, and are excluded from this
  artifact manifest.
- All assets must be previewable and downloadable through `/brand-kit` during
  development.

## 29. Frontend Clean Architecture

Clean architecture di frontend dipakai untuk memisahkan rule produk dari
rendering React. Tujuannya bukan menambah folder sebanyak mungkin, tetapi
membuat setiap perubahan state dapat dilacak dan diuji.

### Layer responsibilities

```text
Presentation
  Pages, sections, component composition, motion orchestration

Application
  Use cases, command handlers, query hooks, state transitions

Domain
  Habit, Goal, CheckIn, Relapse, UserStats, value objects, business rules

Infrastructure
  HTTP client, API DTO mapper, persistence adapter, analytics adapter
```

Dependency direction:

```text
Presentation -> Application -> Domain
Infrastructure -> Application / Domain interfaces
Domain -> nothing outside the domain
```

### Recommended frontend structure

```text
src/
├── app/
│   ├── routes/
│   ├── providers/
│   └── router/
├── features/
│   ├── onboarding/
│   ├── habits/
│   ├── goals/
│   ├── statistics/
│   ├── gamification/
│   └── settings/
├── entities/
│   ├── habit/
│   ├── goal/
│   ├── check-in/
│   └── user-stat/
├── shared/
│   ├── ui/
│   ├── motion/
│   ├── charts/
│   ├── api/
│   ├── hooks/
│   └── tokens/
└── public/brand/
```

### Feature module contract

Setiap feature minimal memiliki:

```text
domain.ts       entity and rule types
api.ts          request and response adapter
queries.ts      read hooks and query keys
commands.ts     mutation hooks and invalidation
state.ts        local reducer/state machine if needed
components/     feature-specific UI
page.tsx        route composition only
```

Page tidak boleh menghitung streak, personal best, atau milestone rule sendiri.
Page hanya memilih data, memanggil command, dan merender state.

## 30. State Ownership and Traceability

### State categories

| State | Owner | Example |
|---|---|---|
| Server state | Query cache | Habits, goals, check-ins, user stats |
| Form state | Form component | Habit name, schedule, goal target |
| Flow state | Reducer/state machine | Onboarding step, milestone sequence |
| View state | Page/component | Selected chart range, opened accordion |
| Global preference | App provider + server | Timezone, reduce motion, notification preference |

### Standard async state

Setiap query dan mutation harus dapat dilacak sebagai:

```text
idle -> loading -> success
                -> error
```

Mutation dengan optimistic update hanya boleh digunakan untuk perubahan yang
mudah dikembalikan. Check-in boleh menurunkan button saat ditekan, tetapi streak
dan gamification baru berubah setelah server mengembalikan success.

### Domain action registry

| Action | State affected | Required result |
|---|---|---|
| `habit.created` | Habit list | New habit, initial stats |
| `habit.updated` | Habit detail/list | Updated habit configuration |
| `check_in.completed` | Habit, check-in, stats | New streak and completion values |
| `check_in.removed` | Habit, check-in, stats | Recalculated values |
| `relapse.recorded` | Habit, relapse, stats | Current streak reset, history retained |
| `goal.created` | Goal list/detail | New attached goal |
| `goal.completed` | Goal, gamification | Completion event and final values |
| `settings.updated` | User preference | Confirmed preference |

### Event response flow

```text
User action
-> disable duplicate action
-> API command
-> server updates domain state
-> server returns updated snapshot + gamification events
-> query cache updates
-> number/progress animation runs only for changed values
-> event response is displayed
```

Jangan menjalankan seluruh gamification rule di frontend. Frontend menerima
event seperti `personal_best`, `milestone`, atau `recovery` dan memilih visual
response yang sesuai.

## 31. Global Motion and Interaction System

Setiap section harus memiliki motion atau interaction yang mempunyai fungsi.
Tidak semua section perlu bergerak terus-menerus.

### Motion levels

| Level | Duration | Usage |
|---|---:|---|
| Press | 120–180ms | Button lowering and releasing |
| Micro transition | 180–240ms | Hover, focus, toggle, tab |
| Section reveal | 360–520ms | First viewport entry |
| Data change | 500–800ms | Progress fill and number ticker |
| Milestone | Maximum 900ms | One-shot meaningful event |

### Section reveal pattern

Default section entrance:

```text
opacity 0 -> 1
translateY 16px -> 0
duration 420ms
easing cubic-bezier(.2,.8,.2,1)
trigger once at 15% viewport visibility
```

Child cards may stagger by 60ms with a maximum total stagger of 240ms. Do not
replay the reveal every time the user scrolls.

### Interaction requirement

Setiap section harus memenuhi minimal satu:

- Changes in response to user input.
- Provides drill-down/navigation.
- Reveals additional detail.
- Animates a meaningful value change.
- Reveals once when entering the viewport.

### Reduced-motion fallback

- Disable parallax, floating loops, counting transitions, and stagger.
- Show the final value immediately.
- Keep hover, focus, expanded/collapsed, selected, success, and error state.
- Motion SVG must settle into its final frame.

## 32. Shared Component Inventory

| Component | Responsibility | States |
|---|---|---|
| `AppShell` | Product navigation and page frame | desktop, mobile, active route |
| `PageHeader` | Kicker, title, summary, page action | default, compact |
| `MotionSection` | One-time viewport reveal | hidden, visible, reduced |
| `RaisedButton` | Primary action | idle, hover, pressed, loading, disabled |
| `HabitCard` | Habit summary and daily action | open, pending, completed, error |
| `GoalCard` | Bounded target summary | collapsed, expanded, completed |
| `StatCard` | Labeled value and context | static, changed, selected |
| `LinearProgress` | Bounded current/target | initial, animating, complete |
| `CircularProgress` | Percentage completion | initial, animating, stable |
| `NumberTicker` | Changed numeric value | stable, increasing, reduced |
| `RangeTabs` | Chart period selection | selected, hover, focus |
| `ChartPanel` | Title, summary, graph, legend | loading, data, empty, error |
| `EventResponse` | Gamification overlay/inline response | entering, stable, dismissed |
| `RecoveryPanel` | Reset explanation/confirmation | closed, open, submitting, success |
| `EmptyState` | Actionable absence of data | neutral, filtered-empty |
| `Skeleton` | Layout-preserving loading | loading only |
| `Toast` | Short mutation result | success, informative, error |

## 33. Homepage — Complete Page Specification

### Page objective

Membuat calon user memahami tiga hal dalam satu scroll: Habit Shaper melacak
aksi, membuat progress terlihat, dan tidak menghukum reset.

### Section map

| Section | Content | Animation or interaction | CTA/result |
|---|---|---|---|
| Navigation | Logo, Method, Progress, Brand Kit | Sticky after first scroll; link underline on hover | Onboarding |
| Hero | Animated verb, promise, product preview | Verb rotates; preview Complete button works | Start with one habit |
| Momentum band | Two brand statements | Three blocks rise once on entry | None |
| The Method | Three-step Progress Spine | Rail fills on entry; nodes focus/hover | Understand workflow |
| Recovery | Reset statement and retained stats | Stats count once; recovery path reveals | Learn recovery behavior |
| Final CTA | The Step, short statement | Raised CTA press response | Onboarding |
| Footer | Brand, promise, year | Link focus/hover only | Brand Kit |

### Hero interaction logic

The preview begins with one incomplete BUILD habit. When Complete is pressed:

```text
button pressed
-> button enters pending
-> simulated or real mutation succeeds
-> completion asset plays once
-> streak increments
-> week indicator fills
-> activity list receives one item
```

Repeated clicks must not add duplicate completion. Undo may be shown inside the
preview only if the implementation clearly labels it.

### Method interaction

Desktop nodes can be hovered or keyboard-focused to emphasize the associated
step. Mobile uses the vertical rail and opens supporting detail on tap. The
method remains understandable without interaction.

## 34. Onboarding — Complete Page and Step Specification

Onboarding is one route with six tracked flow states, not six unrelated pages.
The browser Back action and in-page Back action must not silently discard valid
input.

### Global onboarding layout

- Left rail: logo, progress art, current step number, current step label.
- Main area: one decision, contextual explanation, primary Continue action.
- Top: `Step X of 6` and accessible progress indicator.
- Bottom: Back and Continue.
- Mobile: left rail becomes compact header; progress remains visible.

### State machine

```text
welcome
-> direction
-> action
-> schedule
-> optional_goal
-> review
-> submitting
-> success
```

Error returns the user to `review` with all values retained.

### Step specification

| Step | Input/state | Validation | Animation/interaction |
|---|---|---|---|
| Welcome | None | Always valid | Step blocks rise once; Continue lowers on press |
| Direction | `BUILD` or `BREAK` | One required | Selected tile rises; icon line draws once |
| Action | Habit name | 3–80 chars | Character hint updates; input border responds to validity |
| Schedule | Daily, weekdays, custom | One required | Selected schedule receives moving step mark |
| Optional goal | Toggle, target, deadline, timezone | Goal fields required only when enabled | Fields expand/collapse; number changes with ticker |
| Review | Complete draft | All required values valid | Sections can be edited; completion asset after success |

### Step 1 — Welcome

Headline: `START WITH ONE THING.`

Supporting copy explains that a perfect streak is not required. Interaction is
limited to Continue so the first screen stays calm.

### Step 2 — Direction

BUILD copy: `Repeat an action that helps.`

BREAK copy: `Move away from an action that no longer helps.`

BREAK must not use aggressive warning styling. Changing direction preserves the
habit name but re-evaluates the suggested examples.

### Step 3 — Action

Good examples:

- `Read for 20 minutes`
- `Walk after breakfast`
- `No cigarette after dinner`

Avoid abstract labels such as `Be productive` because they cannot be checked
consistently.

### Step 4 — Schedule

Preset schedules:

- Every day.
- Weekdays.
- Custom days.

Timezone is used to determine the user's local day boundary. Schedule preview
must show the next expected date.

### Step 5 — Optional goal

Goal toggle defaults to off. When enabled, show:

- Consecutive streak target.
- Optional deadline.
- Summary of the attached habit.

Disabling the toggle hides goal fields but keeps the temporary values until the
user leaves onboarding, so accidental toggles do not erase input.

### Step 6 — Review and submit

Review groups: direction, action, schedule, optional goal, timezone. Each group
has an Edit action that returns to the related step.

Submit logic:

```text
create habit
-> if enabled, create attached goal
-> hydrate initial dashboard state
-> play completion response once
-> route to Dashboard
```

If goal creation fails after habit creation succeeds, do not create a duplicate
habit. Show the habit as created and offer to retry the optional goal.

## 35. Dashboard / Today — Complete Page Specification

### First viewport

The user must immediately see:

- Local date.
- `completed / scheduled` summary.
- Today's habit cards.
- One relevant action on every habit.

### Section map

| Section | Data | Animation/interaction |
|---|---|---|
| Today header | Local date and daily completion | Circular progress animates from previous to current value |
| Today's habits | Scheduled habits | Complete/undo; BREAK exposes secondary reset action |
| Momentum stats | Current streak, personal best, total completed | Changed number ticks once; cards link to detail |
| Active goal | Goal current/target/deadline | Linear progress updates; card expands or opens detail |
| Recent events | Latest meaningful activity | New event enters from top; list is not auto-rotating in app |

### Habit-card command logic

BUILD primary command: `Complete today`.

BREAK primary state: clean-day status. `Record relapse` is secondary and opens a
confirmation panel; it must never be visually styled as success.

During mutation:

- Disable the same command.
- Keep other habit cards usable.
- Preserve card height.
- On error, return the button to idle and show a concise retry message.

## 36. Habits Overview, Create/Edit, and Detail

### Habits overview

Sections:

| Section | Interaction | Animation |
|---|---|---|
| Header | Create habit | CTA press response |
| Search/filter | Search, All/Build/Break filter | Result list cross-fades 180ms |
| Active habits | Open detail or daily action | Cards reveal once; changed card number ticks |
| Paused habits | Expand collapsed group | Height transition 240ms |
| Empty state | Clear filter or create habit | Step-grid accent reveals once |

Search and filter are view state; they do not modify domain data.

### Create/edit habit

Use a focused form or side sheet with:

1. BUILD/BREAK type.
2. Habit name.
3. Schedule.
4. Start date.
5. Optional reminder if supported.

Form states:

```text
pristine -> editing -> validating -> submitting -> success
                                      -> error
```

Changing a habit schedule must not rewrite historical check-ins. Edit success
returns the updated habit snapshot and invalidates Today and Habit Detail.

### Habit detail

| Section | Content | Animation or interaction |
|---|---|---|
| Header | Type, name, schedule, edit | Rounded flame floats only if streak active |
| Dominant streak | Current streak | Number ticks after successful check-in |
| Today's action | Complete, undo, or reset | Completion/recovery response |
| Summary stats | Current, personal best, completion | Cards link/focus; changed values animate |
| History calendar | Daily state | Hover/focus day for label; month navigation |
| Trend chart | Completion/streak trend | Range tabs, tooltip, point focus |
| Attached goal | One active goal | Linear progress and open detail |
| Recovery panel | Reset explanation | Expand, confirm, success state |

### Calendar state language

| State | Visual |
|---|---|
| Completed | Deep-red filled day + check |
| Scheduled, open | White day + soft border |
| Missed | Blush day + neutral dot; no failure cross |
| Not scheduled | Low-emphasis text only |
| Today | Warm-ink focus ring |

## 37. Goals Overview, Create/Edit, and Detail

### Goals overview

Active goals appear first. Completed goals live in a quieter archive section.

| Section | Interaction | Animation |
|---|---|---|
| Header | Create goal | Raised press response |
| Active list | Expand summary or open detail | Progress fills once; chevron rotates |
| Completed archive | Expand/collapse | Height and opacity transition |
| Empty state | Create goal or return to habits | Pattern reveal once |

### Create/edit goal

Required fields:

- Goal title.
- Attached habit.
- Consecutive streak target.

Optional field:

- Deadline.

The habit picker only shows compatible active habits. Goal validation never
blocks habit tracking; a user may cancel goal creation and continue with the
habit alone.

### Goal detail

Sections:

1. Goal statement and status.
2. Attached habit.
3. Current / target progress.
4. Deadline and estimated pace.
5. Meaningful event timeline.
6. Edit, pause, or archive actions.

Progress interaction:

- Linear bar animates only when the returned value differs.
- Current and target remain direct text labels.
- Hovering timeline events highlights the matching point on the chart.
- Completion event opens one milestone surface; closing it does not alter goal
  completion state.

## 38. Statistics — Graph and Interaction Specification

Statistics must answer a question, not merely display shapes. Every graph has a
visible title, summary, direct labels, keyboard-focusable points or bars, and a
text alternative.

### Graph inventory

| Graph | Question answered | Default range | Interaction | Animation |
|---|---|---|---|---|
| Completion trend line | Is completion improving? | 30 days | 7d/30d/90d range, hover/focus tooltip | Line draws 700ms; points fade in |
| Daily completion bars | Which days are strongest? | 7 days | Hover/focus exact value; select day | Bars grow from baseline 600ms |
| Habit comparison bars | Which habit needs support? | Current month | Sort completion/streak; open habit | Reorder 240ms; bars resize 600ms |
| Monthly completion ring | What share was completed? | Current month | Previous/next month | Stroke fills 700ms |
| Streak history | How did streaks change? | 90 days | Hover point and open related event | Path draws once; selection pulses once |

### Statistics hierarchy

First viewport:

1. Completion percentage.
2. Current streak.
3. Personal best.
4. Range selector.

Below fold:

1. Trend graph.
2. Daily distribution.
3. Habit comparison.
4. Plain-language insight.

### Tooltip content

Tooltip includes:

- Human-readable date.
- Completed / scheduled actions.
- Percentage where relevant.
- Associated event label if one exists.

Tooltip is supplementary. A summary below the chart must still state the main
finding, for example: `Tuesday is strongest at 92%; Saturday is lowest at 61%.`

### Graph states

| State | Response |
|---|---|
| Loading | Skeleton keeps final chart height |
| Data | Render graph and summary |
| Empty | Explain that check-ins will create the graph |
| Partial | Render available range and label incomplete dates |
| Error | Keep last successful data if available; show Retry |

### Graph color rules

- Primary series: deep red.
- Secondary series: warm ink.
- Comparison/support: soft red with direct label.
- Grid: soft border at low opacity.
- Do not encode success/failure using red versus green.
- Selected data point uses shape and outline in addition to color.

## 39. Profile and Settings — Complete Page Specification

Settings uses restrained interaction and no gamification celebration.

| Section | Controls | Interaction |
|---|---|---|
| Profile | Name, email/avatar if supported | Edit form opens inline or sheet |
| Local day | Timezone | Searchable select; shows UTC offset and current local time |
| Notifications | Reminder toggle and time | Toggle then save; confirmed state appears inline |
| Accessibility | Reduced motion | Applies immediately and persists |
| Onboarding | Restart product tour | Confirmation before resetting onboarding state |
| Data | Export activity | Shows preparation and download state |
| Danger zone | Delete account | Explicit dialog requiring confirmation |

Timezone change must explain its effect: future day boundaries use the new
timezone; existing check-ins retain their recorded timestamps.

Destructive actions use outline/plain styling. They never use raised CTA or
gamification animation.

## 40. Brand Kit — Complete Page Specification

Brand Kit is a developer and designer reference route.

### Sections

1. Identity and logo variants.
2. Palette and design tokens.
3. Typography hierarchy.
4. Functional icons.
5. Motion assets.
6. Progress components.
7. Chart examples.
8. Background and separator examples.
9. Pattern and recovery illustration.
10. State examples: loading, empty, success, error, recovery.

### Required interaction

- Asset cards expose Download action.
- Motion cards expose Replay; one-shot motion does not loop.
- Progress examples expose a value slider or preset buttons.
- Chart examples expose range or dataset switch.
- Color tokens copy their value on click and announce success accessibly.
- Component-state examples use tabs: default, hover/focus, pending, success,
  error, disabled.

Brand Kit may animate for demonstration, but product rules remain visible next
to each demo.

## 41. Loading, Empty, Error, and Offline States

### Loading

- Skeleton follows the final layout.
- Do not show an empty white screen.
- Mutation loading is local to the affected action.
- Avoid rotating flame as a generic loading spinner.

### Empty

| Context | Headline | Primary action |
|---|---|---|
| No habits | `START WITH ONE THING.` | Create first habit |
| No goals | `A FINISH LINE IS OPTIONAL.` | Create goal |
| No statistics | `YOUR PATTERN STARTS HERE.` | Complete first action |
| Filter has no result | `NO MATCHING HABIT.` | Clear filter |

### Error

- State what failed, not who failed.
- Preserve entered form data.
- Offer Retry only when retry is valid.
- Do not display gamification response on failed mutation.

Recommended copy:

```text
WE COULDN'T SAVE THAT CHECK-IN.
Your current streak has not changed. Try again.
```

### Offline

For MVP, default behavior is read-only cached content with a visible offline
banner. Queueing check-ins should only be added if conflict resolution is
implemented. Never show a local completion as server-confirmed when it is not.

## 42. Page Logic and Data Contract Summary

| Page | Main query | Main commands | Invalidates |
|---|---|---|---|
| Dashboard | Today habits, stats, active goals | Complete, undo, relapse | Today, habit detail, stats, goals |
| Habits | Habit list | Create, update, pause | Habit list, Today |
| Habit detail | Habit, history, stats, goal | Complete, undo, relapse, update | Habit, Today, stats, attached goal |
| Goals | Goal list | Create, update, archive | Goal list, related habit |
| Goal detail | Goal, timeline | Update, pause, archive | Goal detail/list |
| Statistics | Aggregate stats by range | Change range is local only | None |
| Settings | User preferences | Update preference, export, delete | Settings, timezone-sensitive queries |

### Response requirement for habit mutation

The API response should contain enough data for deterministic UI updates:

```json
{
  "habit": {
    "id": "habit_id",
    "currentStreak": 18,
    "personalBest": 18,
    "completedToday": true
  },
  "stats": {
    "completionRate": 82,
    "totalCompletedDays": 46
  },
  "events": [
    {
      "type": "personal_best",
      "key": "habit.personal_best.18"
    }
  ]
}
```

Frontend maps `events` to copy variants and visual responses. The event key is
used to prevent the same one-shot response from replaying after refetch.

## 43. Animation and Interaction Registry

This registry ensures every animation has an owner and trigger.

| ID | Surface | Trigger | End state | Replay rule |
|---|---|---|---|---|
| `hero-word-cycle` | Homepage hero | Page visible | Next action word | May loop; pause when tab hidden |
| `preview-complete` | Homepage preview | Preview action success | Updated preview | Per click, no duplicate |
| `section-reveal` | All major sections | First viewport entry | Fully visible | Once per visit |
| `method-rail-fill` | Homepage method | Section entry | Rail complete | Once |
| `onboarding-step` | Onboarding | Valid next/back | New step stable | Per step change |
| `habit-complete` | Dashboard/detail | API success | Completed card | Per confirmed mutation |
| `streak-change` | Stats/card | Value changes | New number | Changed value only |
| `goal-progress` | Goal surfaces | Value changes | New bar width | Changed value only |
| `chart-range` | Statistics | Range selected | New chart stable | Per range change |
| `milestone` | Event response | Server event | Stable milestone surface | Once per event key |
| `recovery` | Reset result | Relapse success | Calm recovery state | Once per event |
| `accordion` | Goal/settings/detail | User toggles | Expanded/collapsed | Every toggle |

## 44. Accessibility Acceptance Criteria

- Semua action dapat dijalankan dengan keyboard.
- Focus indicator memiliki kontras dan tidak tertutup shadow.
- Modal dan milestone overlay mengunci focus dan mengembalikannya ke trigger.
- Chart memiliki direct labels, accessible summary, dan focusable datapoints
  jika library mendukungnya.
- Animation tidak menjadi satu-satunya cara menyampaikan perubahan state.
- Live region dipakai untuk check-in success, error, dan copied token; tidak
  dipakai untuk rotating marketing word.
- Form error terhubung dengan input melalui description/error relationship.
- Progress memiliki accessible name, current value, minimum, dan maximum.
- Touch target minimum 44×44px.
- Layout tetap dapat digunakan pada 200% text zoom.
- `prefers-reduced-motion` dan user setting Reduce Motion sama-sama dihormati;
  pilihan paling restriktif yang berlaku.

## 45. Responsive Page Behavior

### Desktop — 1200px and above

- Persistent product sidebar.
- Two-column analytical sections where useful.
- Charts may sit side by side only if labels remain readable.
- Onboarding uses left visual rail and right decision surface.

### Tablet — 768px to 1199px

- Sidebar may collapse to icons or top navigation.
- Two-column cards may become one or two columns based on content.
- Chart height remains at least 280px.
- Onboarding rail becomes compact but keeps step name.

### Mobile — below 768px

- Product navigation becomes bottom navigation or compact drawer.
- Primary daily action stays reachable without horizontal scroll.
- Stats become horizontal scroll only if every card remains a complete unit;
  otherwise stack vertically.
- Chart legends move below graphs.
- Tables become labeled list rows; do not force unreadable horizontal tables.
- Milestone uses full-screen sheet; recovery remains inline where possible.

## 46. Implementation Acceptance Checklist

### Architecture

- Domain calculation is not duplicated in pages.
- Server state, form state, and view state are separated.
- Every mutation has pending, success, and error state.
- Event responses use stable event keys.
- Feature-specific components do not leak into unrelated modules.

### Visual

- Monument palette and typography are consistent.
- Raised treatment remains selective.
- Flame is rounded and only used for active streak/personal best.
- Motion assets contain no copy.
- Recovery never looks like a punishment state.

### Interaction and animation

- Every major section has a purposeful reveal or interaction.
- Every graph has range/hover/focus interaction and a text summary.
- One-shot responses stop in a stable state.
- Duplicate actions are blocked while pending.
- Reduced motion shows the same information without transition.

### Product logic

- Goal remains optional.
- Check-in and relapse attach to habit.
- Timezone controls local-day boundaries.
- Personal best persists after reset.
- Failed API calls do not display success gamification.

### Quality

- Desktop, tablet, and mobile behavior are defined.
- Loading, empty, error, and offline states exist.
- Keyboard and focus behavior are verified.
- Direct labels exist for every important statistic.
- No essential value is available only through hover.
