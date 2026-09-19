"use client";

import { useState } from "react";
import { habitShaperTokens as t } from "../tokens";
import type { TrendPoint } from "./CompletionTrendChart";

export function DailyCompletionBarChart({ data, title = "Daily completion", summary }: { data: TrendPoint[]; title?: string; summary: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <figure className="hs-chart hs-bar-chart" aria-labelledby="hs-bar-title" aria-describedby="hs-bar-summary">
      <header><h3 id="hs-bar-title">{title}</h3><span>Select a day</span></header>
      <div className="hs-bars">{data.map((point, index) => <button key={`${point.label}-${index}`} className={active === index ? "is-active" : ""} onClick={() => setActive(index)} onFocus={() => setActive(index)} aria-label={`${point.label}: ${point.value}% completion`}><span className="hs-bar-value">{point.value}%</span><span className="hs-bar-track"><i style={{ height: `${Math.min(100, Math.max(0, point.value))}%`, background: active === index ? t.deepRedDark : t.deepRed }} /></span><b>{point.label}</b></button>)}</div>
      {active !== null && <output className="hs-bar-detail"><b>{data[active].label}</b><span>{data[active].value}% completion</span>{data[active].completed !== undefined && <small>{data[active].completed} of {data[active].scheduled} scheduled actions</small>}</output>}
      <figcaption id="hs-bar-summary">{summary}</figcaption>
    </figure>
  );
}

