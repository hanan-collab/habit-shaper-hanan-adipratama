import { habitShaperTokens as t } from "../tokens";
import { accessibilityProps, type BrandSvgProps } from "../types";

export function ActiveFlame({ size = 88, outerColor = t.deepRed, innerColor = t.blush, outlineColor = t.deepRedDark, title = "Active streak", decorative = true, ...props }: BrandSvgProps & { outerColor?: string; innerColor?: string; outlineColor?: string }) {
  return (
    <svg className="hs-active-flame" viewBox="0 0 96 112" width={size} height={typeof size === "number" ? size * 1.167 : size} {...accessibilityProps(title, decorative)} {...props}>
      <g className="hs-flame-body">
        <path d="M51 7c5 19-11 25-6 41 3 10 13 13 20 7 7-6 7-16 3-25 19 15 28 35 22 55-6 18-22 27-42 27S12 102 7 83c-5-20 6-39 26-56-2 15 4 23 14 26-5-17 0-32 4-46Z" fill={outerColor} stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" />
        <path d="M48 58c2 10-7 14-5 23 1 6 7 10 13 8 8-3 10-12 7-21 9 8 13 18 9 27-4 10-13 14-24 13-12-1-21-8-22-18-1-12 7-22 18-31-1 8 1 13 4 16-2-7-1-12 0-17Z" fill={innerColor} />
      </g>
    </svg>
  );
}

