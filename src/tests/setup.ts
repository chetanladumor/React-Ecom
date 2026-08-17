/**
 * @file src/tests/setup.ts
 * @description Setup file for Vitest / React Testing Library environment.
 *
 * @why-it-exists
 * This file runs before every test suite execution, extending Jest/Vitest matching assertions 
 * with DOM-specific assertions (like `toBeInTheDocument()`, `toHaveClass()`, etc.) and setting up global mocks.
 *
 * @why-this-approach
 * - We import `@testing-library/jest-dom` which patches Vitest expect with custom DOM assertions.
 * - We mock standard browser features that jsdom doesn't fully support (like `IntersectionObserver`, `matchMedia`, or `ResizeObserver`).
 *
 * @alternative-approaches
 * - Manual import per test: Importing `@testing-library/jest-dom` in every test file leads to boilerplate repetition.
 * - Global configuration: Placing all configurations in this setup file keeps tests pure and standardized.
 *
 * @enterprise-considerations
 * - Mocking Global APIs: Ensuring common web API mocks are configured here prevents unit tests from breaking 
 *   when components rely on complex APIs (e.g., intersection/scroll controls for infinite scrolls).
 * - Cleanups: Automatically clean up the DOM after each test to avoid test cross-contamination.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically clean up DOM containers after each test to avoid state leaks between test runs.
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver which is not fully simulated by jsdom but required by some UI elements/layout libraries.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock matchMedia for testing responsive UI interactions or dark mode media queries.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
