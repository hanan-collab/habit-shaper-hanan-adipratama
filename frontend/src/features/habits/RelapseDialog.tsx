import { useEffect, useRef, useState } from 'react';
import { FormOverlay } from '../../components/ui/FormOverlay';
import styles from './RelapseDialog.module.css';

export function RelapseDialog({ habitName, pending, onConfirm, onClose }: { habitName: string; pending: boolean; onConfirm: (note?: string) => void; onClose: () => void }) {
  const [note, setNote] = useState(''); const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { input.current?.focus(); const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !pending) onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose, pending]);
  return <FormOverlay eyebrow="Reset with honesty" title="One moment does not erase the pattern." copy={<p>Record the reset for <strong>{habitName}</strong>. Every clean day stays visible.</p>} icon={<img src="/brand/icons/relapse.svg" alt="" />} pending={pending} onClose={onClose} labelledBy="relapse-title" footer={<><button type="button" className="raisedSecondary" disabled={pending} onClick={onClose}>Keep today clear</button><button type="button" className="raisedPrimary" disabled={pending} onClick={() => onConfirm(note.trim() || undefined)}>{pending ? 'Recording…' : 'Report relapse'}</button></>}><label className={styles.field}><span>What made today difficult? <small>Optional</small></span><textarea ref={input} value={note} maxLength={2000} onChange={event => setNote(event.target.value)} placeholder="A trigger, situation, or note for your future self." /></label><small className={styles.reminder}>A reset is data, not a verdict. The next choice is still yours.</small></FormOverlay>;
}
