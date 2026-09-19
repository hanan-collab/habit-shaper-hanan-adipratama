# Magic UI motion rules

These local primitives adapt Magic UI's copy-paste component approach to the
Habit Shaper design system. They use `motion`, CSS Modules, existing brand
tokens, and semantic HTML.

1. `TextAnimate` reveals short display copy by word or character.
2. `BlurFade` introduces a section once as it enters the viewport.
3. `AnimatedList` staggers related list items while preserving their order.
4. `NumberTicker` animates changed progress values with tabular numerals.
5. `Particles` marks a confirmed positive state change only.
6. `MagicCard` adds a restrained pointer-following highlight to elevated cards.
7. `BorderBeam` emphasizes a featured surface without replacing its border.
8. `AnimatedShinyText` is reserved for short labels and milestone copy.

Every primitive honors `prefers-reduced-motion`. Readable text and state labels
remain present when motion is disabled. Product flows must trigger celebration
only after the server confirms the state change.
