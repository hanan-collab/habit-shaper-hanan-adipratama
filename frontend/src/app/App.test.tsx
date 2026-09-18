import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';

test('renders the scaffold without presenting implemented features', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Habit Shaper scaffold' })).toBeInTheDocument();
  expect(screen.getByText(/Product features are not implemented/)).toBeInTheDocument();
});
