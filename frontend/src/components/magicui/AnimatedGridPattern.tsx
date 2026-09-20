import type { CSSProperties } from 'react';
import styles from './Magic.module.css';

export function AnimatedGridPattern({ className = '' }: { className?: string }) {
  return <div className={`${styles.animatedGrid} ${className}`} aria-hidden="true" style={{ '--grid-size': '42px' } as CSSProperties} />;
}
