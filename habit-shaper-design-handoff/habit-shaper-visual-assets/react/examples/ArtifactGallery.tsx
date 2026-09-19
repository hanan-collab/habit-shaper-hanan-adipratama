"use client";

import { useState } from "react";
import {
  ActiveFlame,
  BuildIcon,
  BreakIcon,
  CircularProgress,
  CompletionSuccess,
  CompletionTrendChart,
  DailyCompletionBarChart,
  GoalIcon,
  LinearProgress,
  MilestoneSurface,
  NumberTicker,
  PersonalBestIcon,
  RecoveryProgress,
  RelapseIcon,
  StatisticsIcon,
  StepGrid,
  StepLogo,
  StreakIcon,
} from "../index";

const data = [
  { label: "Mon", value: 67, completed: 2, scheduled: 3 },
  { label: "Tue", value: 100, completed: 3, scheduled: 3 },
  { label: "Wed", value: 82, completed: 2, scheduled: 3 },
  { label: "Thu", value: 100, completed: 3, scheduled: 3 },
  { label: "Fri", value: 76, completed: 2, scheduled: 3 },
];

export function ArtifactGallery() {
  const [eventKey, setEventKey] = useState("completion-1");
  const [progress, setProgress] = useState(60);
  return (
    <main style={{ display: "grid", gap: 32, padding: 32, background: "#fff8f6" }}>
      <section><h2>Logo and icons</h2><div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}><StepLogo /><StepLogo variant="monochrome" /><BuildIcon size={32} /><BreakIcon size={32} /><GoalIcon size={32} /><StatisticsIcon size={32} /><PersonalBestIcon size={32} /><StreakIcon size={32} /><RelapseIcon size={32} /></div></section>
      <section><h2>Motion</h2><div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}><ActiveFlame /><CompletionSuccess eventKey={eventKey} /><button type="button" onClick={() => setEventKey(`completion-${Date.now()}`)}>Replay completion</button></div></section>
      <MilestoneSurface eventKey="demo-best-18" eyebrow="PERSONAL BEST" headline="18 DAYS." supporting="One more day shaped." />
      <section><h2>Progress</h2><LinearProgress label="Read for 30 consecutive days" value={progress} /><CircularProgress value={progress} /><strong><NumberTicker value={progress} />%</strong><input aria-label="Progress value" type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></section>
      <section><h2>Illustrations</h2><StepGrid height={220} /><RecoveryProgress /></section>
      <CompletionTrendChart data={data} summary="Tuesday and Thursday reach 100% completion." />
      <DailyCompletionBarChart data={data} summary="Monday is the lowest day at 67%." />
    </main>
  );
}

