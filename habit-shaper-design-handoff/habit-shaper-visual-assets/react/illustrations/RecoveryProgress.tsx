import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export function RecoveryProgress({ width = "100%", height = 360, title = "Progress continues after a reset", decorative = false, ...props }: BrandSvgProps) {
  const completed = [0, 1, 2, 3];
  const continued = [5, 6, 7];
  return (
    <svg className="hs-recovery" viewBox="0 0 720 360" width={width} height={height} {...accessibilityProps(title, decorative)} {...props}>
      <rect width="720" height="360" rx="32" fill={t.blush} />
      <path d="M70 230H650" stroke={t.softBorder} strokeWidth="8" strokeLinecap="round" />
      <path className="hs-recovery-path" d="M80 230H305C350 230 356 160 405 160H640" fill="none" stroke={t.deepRed} strokeWidth="10" strokeLinecap="round" strokeDasharray="620" />
      {completed.map((index) => <g key={`before-${index}`} transform={`translate(${90 + index * 74} 204)`}><rect width="52" height="52" rx="14" fill={t.white} stroke={t.softRed} strokeWidth="3" /><path d="m14 27 9 9 16-20" fill="none" stroke={t.deepRed} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>)}
      <g transform="translate(349 134)"><rect width="52" height="52" rx="14" fill={t.warmInk} /><path d="M16 26h20" stroke={t.white} strokeWidth="4" strokeLinecap="round" /></g>
      {continued.map((index) => <g key={`after-${index}`} transform={`translate(${386 + (index - 5) * 74} 134)`}><rect width="52" height="52" rx="14" fill={t.white} stroke={t.softRed} strokeWidth="3" /><path d="m14 27 9 9 16-20" fill="none" stroke={t.deepRed} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>)}
      <text x="70" y="75" fill={t.deepRed} fontFamily="Barlow Condensed, sans-serif" fontWeight="900" fontSize="44">PROGRESS CONTINUES.</text>
      <text x="72" y="110" fill={t.warmInk} fontFamily="Space Grotesk, sans-serif" fontSize="17">A reset changes the current streak, not the work already recorded.</text>
    </svg>
  );
}

