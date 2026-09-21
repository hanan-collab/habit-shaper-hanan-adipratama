import styles from './PersonalBestChip.module.css';

export function PersonalBestChip({
  label = 'PERSONAL BEST',
  message = 'One more day shaped.',
  value,
  className = '',
  onDismiss,
}: {
  label?: string;
  message?: string;
  value?: number;
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <div className={`${styles.chip} ${className}`}>
      <aside role="status" aria-live="polite">
        <img src="/brand/motion/flame-active.svg" alt="" aria-hidden="true" />
        <span>
          <strong>
            {label}
            {value !== undefined && ` · ${value} DAYS`}
          </strong>
          <small>{message}</small>
        </span>
        {onDismiss && (
          <button type="button" aria-label="Dismiss progress update" onClick={onDismiss}>
            ×
          </button>
        )}
      </aside>
    </div>
  );
}
