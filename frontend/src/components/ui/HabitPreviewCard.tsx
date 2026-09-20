import { Check } from 'lucide-react';
import { Particles } from '../magicui';
import type { HabitType } from '../../types/domain';
import styles from './HabitPreviewCard.module.css';

export function HabitPreviewCard({ type = 'BUILD', name, streak = 0, done = false, pending = false, burstKey = 0, onToggle }: {
  type?: HabitType;
  name: string;
  streak?: number;
  done?: boolean;
  pending?: boolean;
  burstKey?: number;
  onToggle?: () => void;
}) {
  const action = <span>{done && <Check size={18} />}{pending ? 'SAVING…' : done ? 'COMPLETED' : type === 'BUILD' ? 'COMPLETE TODAY' : 'STAY CLEAR TODAY'}</span>;
  return <article className={styles.card}>
    {burstKey > 0 && <Particles burstKey={burstKey} />}
    <div className={styles.topline}>
      <span className={styles.icon}><img src={type === 'BUILD' ? '/brand/motion/flame-active.svg' : '/brand/icons/break.svg'} alt="" /></span>
      <span className={styles.identity}><small>{type}</small><b>{name || 'Your daily habit'}</b></span>
      <strong>{streak}<small>{type === 'BUILD' ? 'DAY STREAK' : 'DAY CLEAR'}</small></strong>
    </div>
    {onToggle ? <button className={`${styles.action} ${done ? styles.complete : ''}`} type="button" disabled={pending} onClick={onToggle}>{action}</button> : <div className={styles.action} aria-hidden="true">{action}</div>}
  </article>;
}
