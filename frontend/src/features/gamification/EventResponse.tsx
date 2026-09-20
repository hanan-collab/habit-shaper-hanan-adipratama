import { useEffect, useMemo, useRef } from 'react';
import { BorderBeam, Particles } from '../../components/magicui';
import { PersonalBestChip } from '../../components/ui/PersonalBestChip';
import { useToast } from '../../components/ui/ToastProvider';
import type { GamificationEvent } from '../../types/domain';
import styles from './EventResponse.module.css';
const copy: Record<string, [string, string][]> = { HABIT_CREATED: [['HABIT SHAPED.', 'Your next step is ready.']], FIRST_CHECK_IN: [['FIRST STEP.', 'You showed up today.']], DAILY_COMPLETION: [['TODAY: SHAPED.', 'Another action added to the pattern.']], STREAK_STARTED: [['MOMENTUM STARTED.', 'Day one is in place.']], STREAK_MILESTONE: [['{value} DAYS. BUILT.', 'Small actions became visible progress.']], PERSONAL_BEST: [['NEW PERSONAL BEST.', 'Your longest yet: {value} days.']], GOAL_HALFWAY: [['HALFWAY THERE.', '{value} of {target} days completed.']], GOAL_NEARLY_REACHED: [['ONE MORE DAY.', 'Your goal is within reach.']], GOAL_COMPLETED: [['GOAL SHAPED.', 'You reached a {target}-day target.']], PERFECT_WEEK: [['FULL WEEK.', 'You showed up every eligible day.']], RELAPSE_RECORDED: [['RESET RECORDED.', 'Your progress still counts. Shape the next choice.']], COMEBACK: [['BACK IN MOTION.', 'The next step matters more than the gap.']] };
const fill = (value: string, event: GamificationEvent) => value.replace('{value}', String(event.value ?? '')).replace('{target}', String(event.target ?? ''));
export function EventResponse({ events, onDismiss }: { events: GamificationEvent[]; onDismiss: () => void }) {
  const selected = events[0]; const shown = useRef<string | undefined>(undefined); const { pushToast } = useToast();
  const variant = useMemo(() => selected ? (copy[selected.type] ?? [[selected.type.replaceAll('_', ' '), 'Progress updated.']])[0] : null, [selected]);
  const personalBest = selected?.type === 'PERSONAL_BEST';
  const milestone = selected?.level === 'MILESTONE';
  useEffect(() => { if (!selected || !variant || milestone || personalBest) return; const id = `${selected.type}:${selected.habitId ?? ''}:${selected.value ?? ''}`; if (shown.current === id) return; shown.current = id; pushToast({ variant: selected.type === 'RELAPSE_RECORDED' ? 'info' : 'success', title: fill(variant[0], selected), message: fill(variant[1], selected) }); onDismiss(); }, [milestone, onDismiss, personalBest, pushToast, selected, variant]);
  useEffect(() => { if (!personalBest) return; const timer = window.setTimeout(onDismiss, 4400); return () => window.clearTimeout(timer); }, [onDismiss, personalBest]);
  if (selected && variant && personalBest) return <PersonalBestChip className={styles.responseChip} value={selected.value} message={fill(variant[1], selected)} onDismiss={onDismiss} />;
  if (!selected || !variant || !milestone) return null;
  return <div className={styles.backdrop} role="dialog" aria-modal="true"><div className={styles.card}><BorderBeam color="#F8DEDB" /><Particles burstKey={`${selected.type}-${selected.value ?? 0}`} /><img src="/brand/motion/milestone-day-7.svg" alt="" /><span>{selected.level}</span><h2>{fill(variant[0], selected)}</h2><p>{fill(variant[1], selected)}</p><button className="raisedSecondary" onClick={onDismiss}>Keep shaping</button></div></div>;
}
