import { useState } from 'react';
import { Link } from 'react-router';
import { BrandMark } from '../../components/ui/BrandMark';
import { CircularProgress, LinearProgress } from '../../components/ui/Progress';
import styles from './BrandKitPage.module.css';
const colors = [
  ['Warm white', '#FFF8F6'],
  ['Pure white', '#FFFFFF'],
  ['Soft red', '#E67A72'],
  ['Blush', '#F8DEDB'],
  ['Deep red', '#A93F3B'],
  ['Warm ink', '#261F1F'],
  ['Soft border', '#DFB7B3'],
];
const icons = ['build', 'break', 'complete', 'relapse', 'goal', 'statistics', 'personal-best', 'streak'];
const assets = [
  ['The Step Primary', '/brand/logo/the-step-primary.svg'],
  ['The Step Inverted', '/brand/logo/the-step-inverted.svg'],
  ['The Step Monochrome', '/brand/logo/the-step-monochrome.svg'],
];
const motions = [
  ['Active flame', '/brand/motion/flame-active.svg'],
  ['Completion response', '/brand/motion/completion-success.svg'],
  ['Milestone response', '/brand/motion/milestone-day-7.svg'],
];
export function BrandKitPage() {
  const [value, setValue] = useState(68);
  const [replay, setReplay] = useState(0);
  const [state, setState] = useState('default');
  const [announcement, setAnnouncement] = useState('');
  const copy = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setAnnouncement(`${token} copied`);
  };
  return (
    <div className={styles.page}>
      <nav>
        <Link to="/" className={styles.brand}>
          <BrandMark />
          <b>Habit Shaper</b>
        </Link>
        <span>Monument design system</span>
        <Link className="raisedSecondary" to="/">
          Back home
        </Link>
      </nav>
      <header className={styles.hero}>
        <p className="eyebrow">Brand kit · version 1</p>
        <h1>
          The Monument
          <br />
          system.
        </h1>
        <p>
          Calm momentum, made tangible. Preview and download the identity, motion, progress, and interaction language
          used across Habit Shaper.
        </p>
      </header>
      <main>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">01 · Identity</p>
              <h2>The Step.</h2>
            </div>
            <p>One small action, repeated action, visible progress.</p>
          </div>
          <div className={styles.logos}>
            {assets.map(([name, path], index) => (
              <article className={index === 1 ? styles.dark : undefined} key={name}>
                <img src={path} alt={`${name} logo`} />
                <div>
                  <strong>{name}</strong>
                  <a download href={path}>
                    Download SVG ↓
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">02 · Foundation</p>
              <h2>Color & type.</h2>
            </div>
            <p>Warm white creates calm. Deep red carries action and accessible emphasis.</p>
          </div>
          <div className={styles.colors}>
            {colors.map(([name, hex]) => (
              <button key={hex} onClick={() => void copy(hex)}>
                <i style={{ background: hex }} />
                <strong>{name}</strong>
                <span>{hex}</span>
              </button>
            ))}
          </div>
          <div className={styles.typeGrid}>
            <article>
              <span>Barlow Condensed · 900</span>
              <h3>
                VISIBLE
                <br />
                PROGRESS.
              </h3>
            </article>
            <article>
              <span>Space Grotesk · 400–700</span>
              <h4>Small actions become a pattern.</h4>
              <p>Use clear, direct language. Keep supporting copy calm and readable.</p>
            </article>
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">03 · Functional language</p>
              <h2>Icons.</h2>
            </div>
            <p>24 × 24 artboard, rounded caps and joins, one consistent stroke.</p>
          </div>
          <div className={styles.icons}>
            {icons.map((name) => (
              <article key={name}>
                <img src={`/brand/icons/${name}.svg`} alt={`${name} icon`} />
                <strong>{name.replace('-', ' ')}</strong>
                <a download href={`/brand/icons/${name}.svg`}>
                  Download
                </a>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">04 · Motion</p>
              <h2>State change.</h2>
            </div>
            <button className="raisedSecondary" onClick={() => setReplay((value) => value + 1)}>
              Replay all
            </button>
          </div>
          <div className={styles.motion}>
            {motions.map(([name, path]) => (
              <article key={`${name}-${replay}`}>
                <img src={`${path}?replay=${replay}`} alt={`${name} preview`} />
                <div>
                  <strong>{name}</strong>
                  <a download href={path}>
                    Download SVG ↓
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.rule}>
            Motion communicates a confirmed change. It never guesses success, loops celebration, or replaces readable
            text.
          </p>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">05 · Progress</p>
              <h2>Numbers with context.</h2>
            </div>
            <label>
              Demo value{' '}
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
              />
            </label>
          </div>
          <div className={styles.progressDemo}>
            <article>
              <LinearProgress value={value} max={100} label="Goal progress" />
            </article>
            <article>
              <CircularProgress value={value} label="completion" />
            </article>
            <article>
              <span>Number ticker</span>
              <strong>{value}</strong>
              <small>changed values only</small>
            </article>
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">06 · Data visualization</p>
              <h2>Answer a question.</h2>
            </div>
            <p>Direct labels and a text summary remain available without hover.</p>
          </div>
          <div className={styles.chart}>
            <div>
              <strong>Completion trend</strong>
              <span>Is consistency improving?</span>
            </div>
            <svg viewBox="0 0 600 220" role="img" aria-label="Example completion trend rising from 42 to 82 percent">
              <g>
                {[50, 100, 150].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} />
                ))}
              </g>
              <polyline points="0,170 85,150 170,160 255,110 340,125 425,75 510,90 600,40" />
            </svg>
            <p>Completion improves from 42% to 82% across the example range.</p>
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">07 · Background system</p>
              <h2>Change the stage.</h2>
            </div>
            <p>Separators help the user feel progress through a page.</p>
          </div>
          <div className={styles.backgrounds}>
            <article>
              <span>Momentum band</span>
              <div>
                <i />
                <i />
                <i />
              </div>
            </article>
            <article>
              <span>Step grid</span>
              <img src="/brand/patterns/step-grid.svg" alt="" />
            </article>
            <article>
              <span>Recovery path</span>
              <img src="/brand/illustrations/recovery-progress.svg" alt="" />
            </article>
          </div>
        </section>
        <section>
          <div className={styles.heading}>
            <div>
              <p className="eyebrow">08 · Component states</p>
              <h2>Clear at every moment.</h2>
            </div>
          </div>
          <div className={styles.tabs} role="tablist">
            {['default', 'pending', 'success', 'error', 'disabled'].map((value) => (
              <button role="tab" aria-selected={state === value} key={value} onClick={() => setState(value)}>
                {value}
              </button>
            ))}
          </div>
          <div className={styles.stateDemo}>
            <div>
              <strong>{state.toUpperCase()}</strong>
              <p>
                {state === 'error'
                  ? "We couldn't save that check-in. Your streak has not changed."
                  : state === 'success'
                    ? 'DAY 8 LOCKED IN. Your action is recorded.'
                    : state === 'pending'
                      ? 'Saving this action…'
                      : state === 'disabled'
                        ? 'This action is currently unavailable.'
                        : 'Complete today when the action is done.'}
              </p>
            </div>
            <button
              disabled={state === 'disabled' || state === 'pending'}
              className={state === 'error' ? 'raisedSecondary' : 'raisedPrimary'}
            >
              {state === 'pending' ? 'Saving…' : state === 'success' ? 'Completed ✓' : 'Complete today'}
            </button>
          </div>
        </section>
        <p className="srOnly" aria-live="polite">
          {announcement}
        </p>
      </main>
      <footer>
        <BrandMark />
        <span>Habit Shaper · Small actions. Visible progress.</span>
        <Link to="/">Return to product</Link>
      </footer>
    </div>
  );
}
