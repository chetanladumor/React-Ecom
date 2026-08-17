/**
 * @file src/tests/App.test.tsx
 * @description Integration test for the bootstrapped App component.
 *
 * @why-it-exists
 * Verifies that the global Redux and Routing context mounts successfully, handles default redirects 
 * (redirecting "/" to "/products"), and renders the Products Catalog page container correctly.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Bootstrap and Routing', () => {
  it('redirects to products and renders the products catalog header', async () => {
    render(<App />);
    
    // In React Router, redirection and mounting are synchronous/asynchronous.
    // Let's assert that the Products Catalog title is rendered.
    expect(await screen.findByText(/Products Catalog/i)).toBeInTheDocument();
  });
});
