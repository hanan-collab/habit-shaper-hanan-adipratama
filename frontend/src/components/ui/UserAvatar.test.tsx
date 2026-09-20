import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { profileInitial, UserAvatar } from './UserAvatar';
import styles from './UserAvatar.module.css';

describe('UserAvatar', () => {
  test('uses the uppercase username initial', () => expect(profileInitial('hanan', 'other@example.com')).toBe('H'));
  test('falls back to email when username is empty', () => expect(profileInitial('   ', 'ada@example.com')).toBe('A'));
  test('handles unicode code points and surrounding whitespace', () => expect(profileInitial('  élodie  ')).toBe('É'));
  test('keeps the flex centering class on the rendered avatar', () => {
    render(<UserAvatar username="maya" email="m@example.com" />);
    const avatar = screen.getByLabelText('Profile initial M');
    expect(avatar).toHaveClass(styles.avatar, styles.small);
    expect(avatar.firstElementChild).toHaveClass(styles.glyph);
  });
});
