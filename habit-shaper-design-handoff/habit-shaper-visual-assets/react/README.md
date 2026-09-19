# Habit Shaper Editable React Artifacts

Folder ini berisi source TSX yang dapat diedit. Komponen memakai inline SVG dan
CSS sehingga warna, ukuran, timing, data, dan copy dapat diubah tanpa membuka
editor vector.

## Install

1. Copy folder `react/` ke project, misalnya `src/brand/`.
2. Import CSS sekali di root application.
3. Import component dari `index.ts`.

```tsx
import "@/brand/habit-shaper-artifacts.css";
import {
  ActiveFlame,
  CompletionSuccess,
  StepLogo,
} from "@/brand";
```

## Examples

```tsx
<StepLogo variant="primary" size={44} />

<ActiveFlame size={72} decorative />

<CompletionSuccess
  eventKey={event.id}
  active={mutation.isSuccess}
  title="Today's habit completed"
/>
```

Milestone copy tetap menjadi React content:

```tsx
<MilestoneSurface
  eventKey={event.key}
  eyebrow="PERSONAL BEST"
  headline="18 DAYS."
  supporting="One more day shaped."
  onDismiss={closeMilestone}
/>
```

Interactive chart:

```tsx
<CompletionTrendChart
  data={[
    { label: "Mon", value: 67, completed: 2, scheduled: 3 },
    { label: "Tue", value: 100, completed: 3, scheduled: 3 },
    { label: "Wed", value: 82, completed: 2, scheduled: 3 },
  ]}
  summary="Tuesday is strongest at 100% completion."
/>
```

## Editing

- Palette: edit `tokens.ts` and CSS custom properties.
- Logo geometry: edit `logo/StepLogo.tsx`.
- Icon paths: edit `icons/HabitShaperIcon.tsx`.
- Motion timing: edit keyframes in `habit-shaper-artifacts.css`.
- Illustration geometry: edit files under `illustrations/`.
- Graph data and copy: pass props; do not hard-code production values.
- Motion copy: keep in React content; do not embed in motion SVG.

## Replay rules

`CompletionSuccess` remounts its animated sequence when `eventKey` changes.
Use a stable backend event key and never generate a new key on every render.

`MilestoneSurface` also uses `eventKey`. Store dismissed event keys so a
one-shot milestone does not replay after refetch.

## Accessibility

- Set `decorative` for supporting artwork.
- Give meaningful artwork a `title`.
- Charts expose focusable data targets and textual summaries.
- CSS supports system `prefers-reduced-motion` and `[data-motion="reduced"]`.
- UI copy and numbers remain outside motion artwork.

