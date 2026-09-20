import { motion, useReducedMotion } from 'motion/react';
import type { PropsWithChildren, ReactNode } from 'react';
import styles from './Magic.module.css';

export function Dock({ children, className = '', label = 'Navigation' }: PropsWithChildren<{ className?: string; label?: string }>) {
  return <nav className={`${styles.dock} ${className}`} aria-label={label}>{children}</nav>;
}

export function DockItem({ children, label, active = false }: PropsWithChildren<{ label: ReactNode; active?: boolean }>) {
  const reduced = useReducedMotion();
  return <motion.span className={`${styles.dockItem} ${active ? styles.dockItemActive : ''}`} whileHover={reduced ? undefined : { y: -5, scale: 1.06 }} whileTap={reduced ? undefined : { scale: .96 }}>
    {children}<small>{label}</small>
  </motion.span>;
}
