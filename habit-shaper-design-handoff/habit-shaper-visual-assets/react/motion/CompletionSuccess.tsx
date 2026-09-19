import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export function CompletionSuccess({ size = 160, eventKey = "completion", active = true, title = "Action completed", decorative = false, ...props }: BrandSvgProps & { eventKey?: string; active?: boolean }) {
  return (
    <svg className={`hs-completion ${active ? "is-active" : ""}`} viewBox="0 0 180 180" width={size} height={size} {...accessibilityProps(title, decorative)} {...props}>
      <g key={eventKey} className="hs-completion-sequence">
        <rect className="hs-completion-shadow" x="28" y="35" width="124" height="124" rx="31" fill={t.deepRedDark} />
        <rect className="hs-completion-tile" x="28" y="25" width="124" height="124" rx="31" fill={t.white} stroke={t.softRed} strokeWidth="4" />
        <g className="hs-completion-steps" fill={t.deepRed}>
          <rect x="54" y="102" width="29" height="9" rx="4.5" />
          <rect x="54" y="85" width="45" height="9" rx="4.5" />
          <rect x="54" y="68" width="62" height="9" rx="4.5" />
        </g>
        <path className="hs-completion-check" d="m99 109 11 11 25-31" fill="none" stroke={t.deepRed} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

