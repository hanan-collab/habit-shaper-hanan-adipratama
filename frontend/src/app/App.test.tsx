import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers';

test('renders the public route through the application router', () => {
  render(<AppProviders><App /></AppProviders>);
  expect(screen.getByRole('heading',{name:/Build what helps/i})).toBeInTheDocument();
  expect(screen.getByRole('img',{name:/Happy runner crossing a finish line/i})).toHaveAttribute('src','/images/finish-line-runner.png');
  expect(screen.getByRole('status')).toHaveTextContent('PERSONAL BEST');
  expect(screen.getAllByRole('link',{name:/Start with one habit|Start shaping|Create your first habit/i})).toHaveLength(3);
});
