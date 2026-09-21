import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/ToastProvider';
import { EventResponse } from './EventResponse';

describe('EventResponse', () => {
  test('renders a flame chip for a personal best and dismisses it on a timer', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <ToastProvider>
        <EventResponse events={[{ type: 'PERSONAL_BEST', level: 'PROGRESS', value: 8 }]} onDismiss={onDismiss} />
      </ToastProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('PERSONAL BEST · 8 DAYS');
    expect(screen.getByRole('status').querySelector('img')).toHaveAttribute('src', '/brand/motion/flame-active.svg');
    vi.advanceTimersByTime(4400);
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  test('renders milestone achievements as a non-blocking chip', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <ToastProvider>
        <EventResponse events={[{ type: 'STREAK_MILESTONE', level: 'MILESTONE', value: 7 }]} onDismiss={onDismiss} />
      </ToastProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('7 DAYS. BUILT.');
    vi.advanceTimersByTime(4400);
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
