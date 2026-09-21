import { motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';
import styles from './Magic.module.css';
export function TextAnimate({
  children,
  as: Tag = 'span',
  delay = 0,
  by = 'word',
  className = '',
}: {
  children: string;
  as?: ElementType;
  delay?: number;
  by?: 'word' | 'character';
  className?: string;
}) {
  const reduced = useReducedMotion();
  const parts = by === 'character' ? [...children] : children.split(/(\s+)/);
  return (
    <Tag className={`${styles.textAnimate} ${className}`} aria-label={children}>
      {parts.map((part, index) =>
        part.trim() ? (
          <motion.span
            aria-hidden="true"
            className={styles.word}
            key={`${part}-${index}`}
            initial={reduced ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.42, delay: delay + index * 0.045, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {part}
          </motion.span>
        ) : (
          <span aria-hidden="true" key={index}>
            {part}
          </span>
        ),
      )}
    </Tag>
  );
}
