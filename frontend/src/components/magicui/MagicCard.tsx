import { useRef, type CSSProperties, type PropsWithChildren } from 'react';
import styles from './Magic.module.css';
export function MagicCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`${styles.magicCard} ${className}`}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect || !ref.current) return;
        ref.current.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        ref.current.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      }}
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as CSSProperties}
    >
      <span className={styles.magicGlow} />
      {children}
    </div>
  );
}
