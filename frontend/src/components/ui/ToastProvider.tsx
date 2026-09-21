import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import styles from './ToastProvider.module.css';

type ToastVariant = 'success' | 'info' | 'error';
type ToastInput = { variant?: ToastVariant; title: string; message?: string; duration?: number };
type Toast = ToastInput & { id: number; variant: ToastVariant; duration: number };
const ToastContext = createContext<{ pushToast: (toast: ToastInput) => number } | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const pushToast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      const variant = input.variant ?? 'info';
      const item = { ...input, id, variant, duration: input.duration ?? (variant === 'error' ? 6000 : 4200) };
      setItems((current) => [item, ...current].slice(0, 3));
      window.setTimeout(() => dismiss(id), item.duration);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(() => ({ pushToast }), [pushToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <aside className={styles.stack} aria-live="polite">
        <AnimatePresence>
          {items.map((item) => (
            <motion.article
              key={item.id}
              className={`${styles.toast} ${styles[item.variant]}`}
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30 }}
            >
              <span className={styles.icon}>
                {item.variant === 'error' ? <AlertTriangle /> : item.variant === 'success' ? <Check /> : <Info />}
              </span>
              <span className={styles.copy}>
                <strong>{item.title}</strong>
                {item.message && <small>{item.message}</small>}
              </span>
              <button aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>
                <X />
              </button>
              <i style={{ animationDuration: `${item.duration}ms` }} />
            </motion.article>
          ))}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
