import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export type StepLogoVariant = "primary" | "inverted" | "monochrome";

export function StepLogo({ size = 72, variant = "primary", title = "Habit Shaper", decorative = false, ...props }: BrandSvgProps & { variant?: StepLogoVariant }) {
  const inverted = variant === "inverted";
  const mono = variant === "monochrome";
  const face = inverted ? t.deepRed : t.white;
  const border = mono ? t.warmInk : inverted ? t.white : t.softRed;
  const raised = mono ? t.warmInk : inverted ? t.white : t.deepRed;
  const steps = inverted ? t.white : mono ? t.warmInk : t.deepRed;

  return (
    <svg viewBox="0 0 72 78" width={size} height={typeof size === "number" ? size * 1.083 : size} {...accessibilityProps(title, decorative)} {...props}>
      <rect x="3" y="8" width="66" height="66" rx="17" fill={raised} />
      <rect x="3" y="2" width="66" height="66" rx="17" fill={face} stroke={border} strokeWidth="3" />
      <rect x="17" y="45" width="22" height="7" rx="3.5" fill={steps} />
      <rect x="17" y="34" width="31" height="7" rx="3.5" fill={steps} />
      <rect x="17" y="23" width="39" height="7" rx="3.5" fill={steps} />
    </svg>
  );
}

