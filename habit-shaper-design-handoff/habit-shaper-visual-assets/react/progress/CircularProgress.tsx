import { habitShaperTokens as t } from "../tokens";

export function CircularProgress({ value, size = 128, strokeWidth = 11, label = "Completion" }: { value: number; size?: number; strokeWidth?: number; label?: string }) {
  const safe = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);
  return (
    <figure className="hs-circular-progress" aria-label={`${label}: ${safe}%`}>
      <div style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.blush} strokeWidth={strokeWidth} />
          <circle className="hs-progress-circle" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.deepRed} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <strong>{safe}%</strong>
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

