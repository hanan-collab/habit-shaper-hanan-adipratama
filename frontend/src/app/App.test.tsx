import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';
import { AppProviders } from './providers';

test('renders the public route through the application router', () => {
  render(<AppProviders><App /></AppProviders>);
  expect(screen.getByRole('heading',{name:/What helps/i})).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('PERSONAL BEST');
  expect(screen.getByRole('link',{name:'See the method'})).toHaveAttribute('href','#method');
  expect(screen.getByLabelText('Recent progress events')).toHaveTextContent('Morning walk completed');
  expect(screen.getAllByRole('link',{name:/Start with one habit|Start shaping|Create your first habit/i})).toHaveLength(3);
  const completeButton = screen.getByRole('button',{name:'COMPLETE TODAY'});
  fireEvent.click(completeButton);
  expect(screen.getByTestId('particle-burst')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'COMPLETED'})).toBeInTheDocument();
  expect(screen.getByLabelText('7 of seven days completed')).toBeInTheDocument();
});
