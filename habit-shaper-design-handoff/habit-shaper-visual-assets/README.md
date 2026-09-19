# Habit Shaper Visual Asset Kit

Asset kit ini mengikuti arah desain **Monument**:

- Bold, direct, professional, calm.
- Warm white, deep red, soft red, dan blush.
- Raised rounded-square surfaces.
- Gamification yang memberi momentum tanpa menghukum.

## Contents

Untuk aturan sizing, placement, event mapping, accessibility, serta contoh
implementasi React, baca `habit-shaper-artifact-usage-guide.md`.

Source component yang dapat diedit tersedia di folder `react/`. Folder tersebut
berisi inline-SVG React components, progress UI, interactive graph components,
design tokens, dan stylesheet motion.

### Logo

- `logo/the-step-primary.svg`
- `logo/the-step-inverted.svg`
- `logo/the-step-monochrome.svg`

Jaga clear space minimum setengah lebar tile. Jangan menambahkan flame, trophy,
checkmark, atau elemen lain ke dalam logo.

### Functional icons

- `icons/build.svg`
- `icons/break.svg`
- `icons/complete.svg`
- `icons/relapse.svg`
- `icons/goal.svg`
- `icons/statistics.svg`
- `icons/personal-best.svg`
- `icons/streak.svg`

Ikon menggunakan artboard 24×24, stroke 2.25, round cap, dan deep red.
Untuk state disabled, ubah opacity; jangan mengganti bentuk ikon.

### Pattern and illustration

- `patterns/step-grid.svg` — quiet background untuk onboarding, poster, atau empty state.
- `illustrations/recovery-progress.svg` — recovery state tanpa broken/falling metaphor.

### Motion

- `motion/flame-active.svg` — api membulat dengan loop halus untuk streak aktif.
- `motion/completion-success.svg` — response sekali jalan untuk check-in.
- `motion/milestone-day-7.svg` — milestone sequence di bawah 900ms.

Semua animated SVG hanya berisi motion graphic tanpa copy agar teks dapat
di-overlay oleh UI. Seluruhnya menghormati `prefers-reduced-motion`.

## Usage rules

1. Pakai raised treatment hanya untuk interaction, active state, dan milestone.
2. Jangan memakai flame sebagai logo.
3. Jangan menampilkan milestone animation pada page load biasa.
4. Completion animation diputar setelah mutation API berhasil.
5. Relapse/recovery tidak boleh memakai shake, bright error red, atau loss metaphor.
6. Copy tetap singkat: headline 2–6 kata dan satu supporting sentence.

## Color tokens

| Token | Value |
|---|---|
| Warm white | `#FFF8F6` |
| White | `#FFFFFF` |
| Soft red | `#E67A72` |
| Blush | `#F8DEDB` |
| Deep red | `#A93F3B` |
| Deep red dark | `#7F2F2C` |
| Warm ink | `#261F1F` |
| Soft border | `#DFB7B3` |

Copy `tokens.css` ke frontend sebagai starting point. Font yang direkomendasikan:
Barlow Condensed 700–900 untuk display dan Space Grotesk 400–700 untuk UI.

## Notes

- Product screenshot/mockup tidak termasuk dalam kit ini.
- Lifestyle photography belum dibuat karena bersifat opsional dan bukan kebutuhan MVP.
- SVG tetap vector dan dapat diwarnai ulang jika status UI memerlukannya.
