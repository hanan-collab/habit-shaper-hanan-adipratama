import type { CSSProperties, SVGProps } from "react";

export type BrandSvgProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  title?: string;
  decorative?: boolean;
  style?: CSSProperties;
};

export function accessibilityProps(title?: string, decorative = true) {
  return decorative
    ? { "aria-hidden": true as const, focusable: false as const }
    : { role: "img" as const, "aria-label": title ?? "Habit Shaper artwork" };
}

