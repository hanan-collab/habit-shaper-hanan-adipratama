import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import styles from './Magic.module.css';
export function NumberTicker({
  value,
  className = '',
  suffix = '',
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(motionValue, (latest) => `${Math.round(latest)}${suffix}`);
  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
    return controls.stop;
  }, [value, reduced, motionValue]);
  return <motion.span className={`${styles.number} ${className}`}>{rounded}</motion.span>;
}
