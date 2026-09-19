import type { ReactNode } from "react";
import { habitShaperTokens as t } from "../tokens";
import { StepLogo } from "../logo/StepLogo";

export function MilestoneSurface({ eventKey, eyebrow, headline, supporting, action, onDismiss }: { eventKey: string; eyebrow: string; headline: string; supporting: string; action?: ReactNode; onDismiss?: () => void }) {
  return (
    <section key={eventKey} className="hs-milestone" role="dialog" aria-labelledby={`${eventKey}-title`}>
      <div className="hs-milestone-mark"><StepLogo variant="inverted" size={76} decorative /></div>
      <div className="hs-milestone-copy">
        <span>{eyebrow}</span>
        <h2 id={`${eventKey}-title`}>{headline}</h2>
        <p>{supporting}</p>
        <div className="hs-milestone-actions">{action}{onDismiss && <button type="button" onClick={onDismiss}>Continue</button>}</div>
      </div>
      <span className="hs-milestone-line" aria-hidden="true" />
      <style>{`.hs-milestone{--hs-red:${t.deepRed};--hs-dark:${t.deepRedDark};--hs-blush:${t.blush}}`}</style>
    </section>
  );
}

