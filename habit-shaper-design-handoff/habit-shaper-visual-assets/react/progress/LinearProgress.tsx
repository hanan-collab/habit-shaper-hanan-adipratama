import { habitShaperTokens as t } from "../tokens";

export function LinearProgress({ value, max = 100, label, showValues = true }: { value: number; max?: number; label: string; showValues?: boolean }) {
  const safe = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : Math.round((safe / max) * 100);
  return (
    <div className="hs-linear-progress">
      <div className="hs-progress-label"><span>{label}</span>{showValues && <strong>{safe} / {max}</strong>}</div>
      <div className="hs-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={safe}>
        <span style={{ width: `${percentage}%`, background: t.deepRed }} />
      </div>
    </div>
  );
}

