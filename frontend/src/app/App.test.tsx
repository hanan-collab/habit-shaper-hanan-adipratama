import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers';

test('renders the public route through the application router', () => {
  render(<AppProviders><App /></AppProviders>);
  expect(screen.getByRole('heading',{name:/Build what helps/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Complete today'})).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('PERSONAL BEST · 7 DAYS');
  fireEvent.click(screen.getByRole('button',{name:'Complete today'}));
  expect(screen.getByRole('status')).toHaveTextContent('PERSONAL BEST · 8 DAYS');
  expect(screen.getByTestId('particle-burst')).toBeInTheDocument();
});
