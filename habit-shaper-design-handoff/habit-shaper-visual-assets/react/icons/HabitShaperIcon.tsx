import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export type HabitShaperIconName = "build" | "break" | "complete" | "relapse" | "goal" | "statistics" | "personal-best" | "streak";

export function HabitShaperIcon({ name, size = 24, color = t.deepRed, title, decorative = true, ...props }: BrandSvgProps & { name: HabitShaperIconName; color?: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...accessibilityProps(title ?? name, decorative)} {...props}>
      {name === "build" && <><path d="M5 18h4v-4h4v-4h6" {...common} /><path d="m15 6 4 4-4 4" {...common} /></>}
      {name === "break" && <><path d="M6 6h5l2 4-3 3 2 5h6" {...common} /><path d="m15 15 3 3-3 3" {...common} /></>}
      {name === "complete" && <><rect x="3.5" y="3.5" width="17" height="17" rx="5" {...common} /><path d="m7.5 12 3 3 6-7" {...common} /></>}
      {name === "relapse" && <><path d="M6.5 8.5A7 7 0 1 1 5 14" {...common} /><path d="M6.5 4v4.5H11" {...common} /></>}
      {name === "goal" && <><circle cx="12" cy="12" r="8" {...common} /><circle cx="12" cy="12" r="3" {...common} /><path d="m14 10 5-5" {...common} /></>}
      {name === "statistics" && <><path d="M4 20V11M10 20V5M16 20v-7M22 20H2" {...common} /></>}
      {name === "personal-best" && <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" {...common} /><path d="M8 6H4v1a4 4 0 0 0 5 4M16 6h4v1a4 4 0 0 1-5 4M12 12v5M8 20h8M9 17h6" {...common} /></>}
      {name === "streak" && <path d="M13 3c1 4-2 5-2 8 0 1.5 1 2.5 2 2.5 2 0 3-2 2.5-4.5 2.5 2 4.5 5 3.5 8a7 7 0 0 1-13.5 0C3 13 6 9 10 6c-.5 3 1 4 3 5" {...common} />}
    </svg>
  );
}

export const BuildIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="build" {...props} />;
export const BreakIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="break" {...props} />;
export const CompleteIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="complete" {...props} />;
export const RelapseIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="relapse" {...props} />;
export const GoalIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="goal" {...props} />;
export const StatisticsIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="statistics" {...props} />;
export const PersonalBestIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="personal-best" {...props} />;
export const StreakIcon = (props: Omit<Parameters<typeof HabitShaperIcon>[0], "name">) => <HabitShaperIcon name="streak" {...props} />;

