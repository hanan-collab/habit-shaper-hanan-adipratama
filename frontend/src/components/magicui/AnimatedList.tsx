import { motion, useReducedMotion } from 'motion/react';
import { Children, type PropsWithChildren } from 'react';
import styles from './Magic.module.css';
type Direction = 'top' | 'bottom' | 'left' | 'right';
export function AnimatedList({
  children,
  className = '',
  from = 'bottom',
}: PropsWithChildren<{ className?: string; from?: Direction }>) {
  const reduced = useReducedMotion();
  const offset = from === 'top' ? { y: -14 } : from === 'bottom' ? { y: 12 } : from === 'left' ? { x: -22 } : { x: 22 };
  return (
    <motion.div
      className={`${styles.animatedList} ${className}`}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : 0.09 } } }}
    >
      {Children.map(children, (child) => (
        <motion.div
          layout={!reduced}
          variants={{
            hidden: reduced ? {} : { opacity: 0, ...offset },
            visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.38 } },
          }}
          transition={{ layout: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
