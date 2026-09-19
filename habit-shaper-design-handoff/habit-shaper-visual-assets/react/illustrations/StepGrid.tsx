import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export function StepGrid({ width = "100%", height = 360, columns = 7, rows = 5, color = t.deepRed, opacity = 0.12, title = "Step pattern", decorative = true, ...props }: BrandSvgProps & { columns?: number; rows?: number; color?: string; opacity?: number }) {
  const cells = Array.from({ length: columns * rows }, (_, index) => ({ x: index % columns, y: Math.floor(index / columns) }));
  return (
    <svg viewBox={`0 0 ${columns * 64} ${rows * 64}`} width={width} height={height} preserveAspectRatio="xMidYMid slice" {...accessibilityProps(title, decorative)} {...props}>
      <rect width="100%" height="100%" fill={t.warmWhite} />
      <g fill="none" stroke={color} strokeWidth="2" opacity={opacity}>
        {cells.map(({ x, y }) => <rect key={`${x}-${y}`} x={x * 64 + 8} y={y * 64 + 8} width="48" height="48" rx="13" />)}
      </g>
      <g fill={color} opacity={opacity * 1.8}>
        {cells.filter((_, index) => index % 4 === 0).map(({ x, y }) => <path key={`step-${x}-${y}`} d={`M${x * 64 + 20} ${y * 64 + 43}h10v-8h10v-8h10`} />)}
      </g>
    </svg>
  );
}

