import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

afterEach(cleanup);
