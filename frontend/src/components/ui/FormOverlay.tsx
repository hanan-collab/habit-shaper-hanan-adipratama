import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import styles from './FormOverlay.module.css';

export function FormOverlay({
  title,
  eyebrow,
  copy,
  icon,
  pending,
  onClose,
  children,
  footer,
  labelledBy = 'form-overlay-title',
}: PropsWithChildren<{
  title: string;
  eyebrow: string;
  copy?: ReactNode;
  icon?: ReactNode;
  pending?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  labelledBy?: string;
}>) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const pendingRef = useRef(pending);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRef.current) onCloseRef.current();
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0],
        last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !pending && onClose()}
    >
      <motion.section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={styles.dialog}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <button
          ref={closeButton}
          type="button"
          className={styles.close}
          aria-label="Close"
          disabled={pending}
          onClick={onClose}
        >
          <X />
        </button>
        {icon && <div className={styles.icon}>{icon}</div>}
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={labelledBy}>{title}</h2>
        {copy && <div className={styles.copy}>{copy}</div>}
        <div className={styles.body}>{children}</div>
        {footer && <footer>{footer}</footer>}
      </motion.section>
    </div>
  );
}
