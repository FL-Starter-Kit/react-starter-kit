/**
 * Vitest global setup: jest-dom matchers, MSW node server lifecycle,
 * axe-core matcher registration, and per-test isolation.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { loadConfig } from '@/app/config/env';
import { resetMockServer, server } from '@/tests/mocks/node';

// The app reads validated env config at bootstrap; initialize it once for
// tests so pages that call getConfig() work (values default sensibly).
loadConfig();

// jsdom does not implement <dialog> or matchMedia; polyfill what the app
// relies on so tests exercise the real components.
if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
}

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

// Radix primitives measure their content (Popper/use-size) with ResizeObserver,
// which jsdom does not implement; a no-op stub keeps them renderable in tests.
if (typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {
      // Elements are never actually measured in jsdom.
    }
    unobserve(): void {
      // Nothing is being observed.
    }
    disconnect(): void {
      // Nothing to clean up.
    }
  }
  window.ResizeObserver = ResizeObserverStub;
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  resetMockServer();
});

afterAll(() => {
  server.close();
});
