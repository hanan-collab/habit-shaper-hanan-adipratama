import styles from './UserAvatar.module.css';

export function profileInitial(username?: string | null, email?: string | null) {
  const source = username?.trim() || email?.trim() || '?';
  return [...source][0]?.toLocaleUpperCase() ?? '?';
}

export function UserAvatar({
  username,
  email,
  size = 'small',
  className = '',
}: {
  username?: string | null;
  email?: string | null;
  size?: 'small' | 'large';
  className?: string;
}) {
  const initial = profileInitial(username, email);
  return (
    <span className={`${styles.avatar} ${styles[size]} ${className}`} aria-label={`Profile initial ${initial}`}>
      <span className={styles.glyph} aria-hidden="true">
        {initial}
      </span>
    </span>
  );
}
