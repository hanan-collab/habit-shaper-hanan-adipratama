import styles from './HabitIcon.module.css';
const icons = ['build', 'break', 'complete', 'streak', 'statistics', 'personal-best'];
const iconFor = (seed: string) =>
  icons[[...seed].reduce((total, character) => (total + character.charCodeAt(0)) % icons.length, 0)];
export function HabitIcon({ seed, className = '' }: { seed: string; className?: string }) {
  const icon = iconFor(seed);
  return (
    <span className={`${styles.icon} ${className}`} aria-hidden="true">
      <img src={`/brand/icons/${icon}.svg`} alt="" />
    </span>
  );
}
