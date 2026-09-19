# Habit Shaper Artifact Usage Guide

Dokumen ini menjelaskan cara menggunakan seluruh visual artifact Habit Shaper.
Design decisions, page logic, state, graph, dan interaction specification yang
lebih lengkap berada di `habit-shaper-design-guideline.md` dalam handoff bundle.

## 1. Folder Structure

```text
public/brand/
├── logo/
│   ├── the-step-primary.svg
│   ├── the-step-inverted.svg
│   └── the-step-monochrome.svg
├── icons/
│   ├── build.svg
│   ├── break.svg
│   ├── complete.svg
│   ├── relapse.svg
│   ├── goal.svg
│   ├── statistics.svg
│   ├── personal-best.svg
│   └── streak.svg
├── motion/
│   ├── flame-active.svg
│   ├── completion-success.svg
│   └── milestone-day-7.svg
├── patterns/
│   └── step-grid.svg
└── illustrations/
    └── recovery-progress.svg
```

Semua path pada contoh mengasumsikan isi folder ini disalin ke
`frontend/public/brand/`.

## 2. Quick Installation

1. Salin folder `logo`, `icons`, `motion`, `patterns`, dan `illustrations` ke
   `public/brand/`.
2. Gunakan absolute public path seperti `/brand/icons/build.svg`.
3. Render label dan headline sebagai HTML/React, bukan menambahkannya ke SVG.
4. Hormati `prefers-reduced-motion` dan setting Reduce Motion milik user.
5. Gunakan artifact hanya pada state yang ditentukan di guide ini.

```tsx
<img src="/brand/icons/build.svg" alt="" width={24} height={24} />
```

Decorative icon memakai `alt=""`. Jika icon menjadi satu-satunya label pada
button, button wajib memiliki `aria-label`.

## 3. Logo — The Step

### Primary logo

File: `logo/the-step-primary.svg`

Gunakan pada warm-white/pure-white background, navbar, product sidebar, dan
default product surfaces. Jangan gunakan pada deep-red background atau crop
yang membuat raised edge tidak terlihat.

### Inverted logo

File: `logo/the-step-inverted.svg`

Gunakan pada deep-red, warm-ink, dan milestone surface.

### Monochrome logo

File: `logo/the-step-monochrome.svg`

Gunakan untuk black-and-white print, watermark satu warna, atau dokumen yang
tidak dapat mempertahankan palette utama.

### Sizing and clear space

- Minimum digital size: 32×32px.
- Navbar: 36–44px.
- Milestone: 64–96px.
- Clear space: minimum setengah lebar tile pada semua sisi.
- Jangan menambahkan flame, trophy, checkmark, atau angka ke dalam mark.

## 4. Functional Icon System

Icon membantu label; icon tidak menggantikan label untuk action penting.

| Icon | Use | Do not use |
|---|---|---|
| `build.svg` | BUILD habit dan direction selector | Generic add button |
| `break.svg` | BREAK habit dan direction selector | Delete atau error |
| `complete.svg` | Successful check-in | Generic checkbox sebelum success |
| `relapse.svg` | Record relapse/reset | Failed network request |
| `goal.svg` | Attached goal dan goal navigation | Daily check-in |
| `statistics.svg` | Analytics dan trend | Decorative chart background |
| `personal-best.svg` | Personal-best value/event | Semua streak card |
| `streak.svg` | Current active streak | Logo atau loading spinner |

Recommended sizes:

```text
Inline label       16–18px
Button             18–20px
Habit card         24–32px
Empty state        40–56px maximum
```

Disabled icons mengubah opacity, bukan bentuk.

## 5. Rounded Active Flame

File: `motion/flame-active.svg`

Purpose: menunjukkan streak yang saat ini aktif. Flame bukan logo dan bukan
generic celebration.

Gunakan pada Habit Detail dominant streak, current streak card, atau personal
best saat current streak menyamai/melewati best. Jangan gunakan untuk zero
streak, relapse, loading, atau setiap habit card sekaligus.

```text
Compact card       28–36px
Detail header      56–88px
Milestone overlay  72–112px
```

```tsx
<div className="streak-display">
  <img src="/brand/motion/flame-active.svg" alt="" />
  <strong>18</strong>
  <span>DAY STREAK</span>
</div>
```

Flame boleh loop secara subtle. Under reduced motion, tampilkan final frame.

## 6. Completion Response

File: `motion/completion-success.svg`

Trigger: hanya setelah mutation `check_in.completed` sukses.

```text
user presses Complete
-> button enters pending
-> API returns success
-> server snapshot updates
-> completion SVG plays once
-> changed numbers animate
-> response settles
```

Gunakan pada Dashboard habit card, Habit Detail check-in, dan final onboarding
setelah habit berhasil dibuat. Jangan play saat page load, sebelum API sukses,
ketika cached completed state dirender, atau setelah error.

```tsx
<EventResponse aria-live="polite">
  <img src="/brand/motion/completion-success.svg" alt="" />
  <div>
    <strong>TODAY IS SHAPED.</strong>
    <p>Your streak is now 18 days.</p>
  </div>
</EventResponse>
```

Copy tidak menjadi bagian SVG agar dynamic number dan localization tetap aman.

## 7. Milestone Response

File: `motion/milestone-day-7.svg`

Gunakan untuk 7-day milestone, goal completion, atau new personal best.
Frontend memasukkan number dan copy sesuai event backend.

| Event | Headline | Supporting copy |
|---|---|---|
| `streak_milestone:7` | `7 DAYS LOCKED IN.` | `Small actions became visible progress.` |
| `personal_best` | `A NEW PERSONAL BEST.` | `One more day shaped.` |
| `goal_completed` | `GOAL SHAPED.` | `The finish line came from daily action.` |

Playback rules:

- One-shot; stable dalam maksimum 900ms.
- Show sekali per stable event key.
- Dismissible setelah content stabil.
- Tidak replay setelah refetch atau back navigation.
- Reduced motion langsung menampilkan final surface.

## 8. Step Grid Pattern

File: `patterns/step-grid.svg`

Gunakan untuk onboarding visual rail, empty state, Brand Kit sample, atau quiet
marketing transition.

```css
.step-pattern {
  background-color: #fff8f6;
  background-image: url('/brand/patterns/step-grid.svg');
  background-size: 360px auto;
  background-position: center;
}
```

Jaga opacity lebih rendah dari content. Jangan menaruh body copy panjang di atas
crop yang ramai dan jangan membuat pattern bergerak terus-menerus.

## 9. Recovery Progress Illustration

File: `illustrations/recovery-progress.svg`

Gunakan pada recovery education, relapse success, first-relapse learning state,
dan Brand Kit.

```text
RESET RECORDED.
Your progress still counts.
```

Jangan dipasangkan dengan `You failed`, broken/falling visuals, bright error
red, shake, atau loss sound. UI tetap menampilkan personal best, total completed
days, dan history sebelumnya.

## 10. Progress Components

Progress adalah dynamic UI component, bukan static image.

### Linear progress

Gunakan untuk bounded goal seperti `18 / 30 days` dan onboarding `Step 4 of 6`.
Jangan gunakan untuk streak tanpa target.

```tsx
<Progress value={18} max={30} aria-label="18 of 30 goal days completed" />
```

Current dan target wajib ditulis. Animate hanya dari confirmed value sebelumnya
ke confirmed value baru.

### Circular progress

Gunakan hanya untuk percentage completion: Today, weekly, atau monthly rate.
Render percentage sebagai direct text.

### Number ticker

Gunakan ketika current streak, personal best, completion rate, atau total
completed days berubah. Jangan count dari nol setiap page load.

## 11. Graph Usage

Graph tidak dikirim sebagai static SVG karena datanya dinamis.

| Graph | Primary color | Required interaction |
|---|---|---|
| Completion trend line | Deep red | Range selection dan point tooltip |
| Daily completion bars | Deep red + blush | Hover/focus exact value |
| Habit comparison | Deep red, soft red, warm ink | Sort dan open habit |
| Completion ring | Deep red track on blush | Previous/next period |
| Streak history | Warm ink + deep-red active point | Event point selection |

Setiap graph memiliki title, visible range, direct labels, accessible summary,
loading, empty, partial, error state, dan keyboard access jika chart library
mendukungnya.

## 12. Asset-to-Page Mapping

| Page | Primary artifacts |
|---|---|
| Homepage | Primary logo, flame, completion, goal/stat icons, step grid |
| Onboarding | Primary logo, build/break icons, step grid, completion |
| Dashboard | Build/break, streak, personal best, completion |
| Habits overview | Build/break, step-grid empty state |
| Habit detail | Flame, completion, relapse, recovery illustration |
| Goals | Goal icon, milestone, linear progress |
| Statistics | Statistics/streak/personal-best icons; dynamic graphs |
| Settings | Primary logo only; no celebration motion |
| Brand Kit | All artifacts and interactive examples |

## 13. Gamification Event Mapping

Frontend menerima event dari backend dan memilih response; frontend tidak
menjalankan ulang semua gamification rule.

| Backend event | Visual artifact | UI behavior |
|---|---|---|
| `check_in_completed` | Completion | Inline response; update numbers |
| `streak_milestone` | Milestone | Dismissible milestone surface |
| `personal_best` | Flame + milestone | Show new value and short copy |
| `goal_completed` | Milestone | Goal completion surface |
| `relapse_recorded` | Recovery illustration | Calm inline recovery response |

Gunakan stable event key agar one-shot response tidak replay setelah refetch.

## 14. Accessibility

- Decorative image: `alt=""`.
- Meaningful standalone illustration: concise alt text.
- Icon-only action: accessible button name.
- Motion bukan satu-satunya success/error feedback.
- Announce confirmed check-in dan error lewat polite live region.
- Respect system dan product Reduce Motion.
- Dynamic number dan copy tidak ditanam dalam SVG.
- Touch target minimum 44×44px.

## 15. Do and Don't

### Do

- Keep copy in React/HTML.
- Use one dominant response per event.
- Preserve previous progress in recovery.
- Use deep red for accessible primary emphasis.
- Load SVGs from consistent `/brand/` paths.
- Track which one-shot event has been shown.

### Don't

- Use flame as the logo.
- Loop completion atau milestone.
- Play success motion before server confirmation.
- Add confetti, coins, atau cartoon badges.
- Use relapse icon for generic errors.
- Use pattern behind dense charts.
- Recolor individual icons inconsistently.

## 16. Delivery Checklist

- [ ] All files exist under `public/brand/`.
- [ ] No motion SVG contains product copy.
- [ ] Every one-shot animation has a named trigger.
- [ ] Event key prevents duplicate playback.
- [ ] Reduced-motion state is tested.
- [ ] Logo variant matches its background.
- [ ] Dynamic graphs use UI components, not static images.
- [ ] Important icons have visible labels.
- [ ] Recovery copy retains previous progress.
- [ ] Brand Kit can preview and download every artifact.

