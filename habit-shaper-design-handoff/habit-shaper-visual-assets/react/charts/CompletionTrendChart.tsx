"use client";

import { useMemo, useState } from "react";
import { habitShaperTokens as t } from "../tokens";

export type TrendPoint = { label: string; value: number; completed?: number; scheduled?: number };

export function CompletionTrendChart({ data, title = "Completion trend", summary }: { data: TrendPoint[]; title?: string; summary: string }) {
  const [active, setActive] = useState<number | null>(null);
  const geometry = useMemo(() => {
    const width = 680, height = 260, left = 46, right = 20, top = 24, bottom = 44;
    const innerWidth = width - left - right, innerHeight = height - top - bottom;
    const points = data.map((point, index) => ({ ...point, x: left + (index * innerWidth) / Math.max(1, data.length - 1), y: top + innerHeight - (Math.min(100, Math.max(0, point.value)) / 100) * innerHeight }));
    return { width, height, left, right, top, bottom, points, path: points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ") };
  }, [data]);

  return (
    <figure className="hs-chart" aria-labelledby="hs-trend-title" aria-describedby="hs-trend-summary">
      <header><h3 id="hs-trend-title">{title}</h3><span>Hover or focus a point</span></header>
      <div className="hs-chart-canvas">
        <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={summary}>
          {[0, 25, 50, 75, 100].map((value) => { const y = geometry.top + (100 - value) / 100 * (geometry.height - geometry.top - geometry.bottom); return <g key={value}><line x1={geometry.left} x2={geometry.width - geometry.right} y1={y} y2={y} stroke={t.softBorder} strokeDasharray="4 5" /><text x={geometry.left - 10} y={y + 4} textAnchor="end" fill={t.warmInk} opacity=".62" fontSize="11">{value}%</text></g>; })}
          <path className="hs-chart-area" d={`${geometry.path} L${geometry.points.at(-1)?.x ?? 0},${geometry.height - geometry.bottom} L${geometry.points[0]?.x ?? 0},${geometry.height - geometry.bottom} Z`} fill={t.blush} />
          <path className="hs-chart-line" d={geometry.path} fill="none" stroke={t.deepRed} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {geometry.points.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={point.x} cy={point.y} r={active === index ? 8 : 5} fill={active === index ? t.deepRedDark : t.deepRed} /><text x={point.x} y={geometry.height - 18} textAnchor="middle" fill={t.warmInk} fontSize="12">{point.label}</text></g>)}
        </svg>
        <div className="hs-chart-hit-layer" style={{ gridTemplateColumns: `repeat(${data.length},1fr)` }}>{data.map((point, index) => <button key={`${point.label}-hit`} aria-label={`${point.label}: ${point.value}% completion`} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} />)}</div>
        {active !== null && <output className="hs-chart-tooltip" style={{ left: `${(geometry.points[active].x / geometry.width) * 100}%`, top: `${(geometry.points[active].y / geometry.height) * 100}%` }}><b>{geometry.points[active].label}</b><span>{geometry.points[active].value}% complete</span>{geometry.points[active].completed !== undefined && <small>{geometry.points[active].completed} of {geometry.points[active].scheduled} actions</small>}</output>}
      </div>
      <figcaption id="hs-trend-summary">{summary}</figcaption>
    </figure>
  );
}

