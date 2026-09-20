import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { PropsWithChildren, ReactNode } from 'react';
import styles from './FormOverlay.module.css';

export function FormOverlay({ title, eyebrow, copy, icon, pending, onClose, children, footer, labelledBy = 'form-overlay-title' }: PropsWithChildren<{ title: string; eyebrow: string; copy?: ReactNode; icon?: ReactNode; pending?: boolean; onClose: () => void; footer?: ReactNode; labelledBy?: string }>) {
  return <div className={styles.backdrop} role="presentation" onMouseDown={event => event.target === event.currentTarget && !pending && onClose()}><motion.section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={styles.dialog} initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}><button className={styles.close} aria-label="Close" disabled={pending} onClick={onClose}><X /></button>{icon && <div className={styles.icon}>{icon}</div>}<p className="eyebrow">{eyebrow}</p><h2 id={labelledBy}>{title}</h2>{copy && <div className={styles.copy}>{copy}</div>}<div className={styles.body}>{children}</div>{footer && <footer>{footer}</footer>}</motion.section></div>;
}
