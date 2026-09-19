import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers';

test('renders the public route through the application router', () => {
  render(<AppProviders><App /></AppProviders>);
  expect(screen.getByRole('heading',{name:'Build what helps.'})).toBeInTheDocument();
});
