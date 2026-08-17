/**
 * @file src/features/auth/tests/auth.test.tsx
 * @description Unit tests for authentication state slice and form components.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router';
import authReducer, { setCredentials, logout, updateTokens, type UserProfile } from '../slice/authSlice';
import notificationReducer from '@/store/slices/notificationSlice';
import themeReducer from '@/store/slices/themeSlice';
import { api } from '@/services/api';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

// Helper utility to render components with fresh test Redux and Router contexts
function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        notification: notificationReducer,
        theme: themeReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(api.middleware),
      preloadedState,
    }),
    route = '/login',
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper }) };
}

const mockUser: UserProfile = {
  id: 2,
  username: 'morrison',
  email: 'morrison@gmail.com',
  name: { firstname: 'David', lastname: 'Morrison' },
  role: 'user',
};

describe('Auth Redux State Slice', () => {
  it('should return the initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should handle setCredentials', () => {
    const prevState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
    };
    
    const state = authReducer(
      prevState,
      setCredentials({
        user: mockUser,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-456');
    expect(state.tokenExpiresAt).toBeGreaterThan(Date.now());
  });

  it('should handle updateTokens', () => {
    const prevState = {
      isAuthenticated: true,
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      tokenExpiresAt: Date.now() + 5000,
    };

    const state = authReducer(prevState, updateTokens({ accessToken: 'new-access-token-999', refreshToken: 'new-refresh-token-123' }));
    
    expect(state.accessToken).toBe('new-access-token-999');
    expect(state.refreshToken).toBe('new-refresh-token-123');
    expect(state.tokenExpiresAt).toBeGreaterThan(Date.now() + 5000);
  });

  it('should handle logout', () => {
    const prevState = {
      isAuthenticated: true,
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      tokenExpiresAt: Date.now() + 5000,
    };

    const state = authReducer(prevState, logout());

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.tokenExpiresAt).toBeNull();
  });
});

describe('LoginForm Validation', () => {
  it('renders login fields correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays validation warnings on empty form submit', async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password must be at least 4 characters/i)).toBeInTheDocument();
  });
});

describe('RegisterForm Layout', () => {
  it('renders personal details and credential headers', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByText(/Personal Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Account Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Shipping Address/i)).toBeInTheDocument();
  });

  it('validates password matching check on registration submit', async () => {
    renderWithProviders(<RegisterForm />);

    // Fill password differently than confirmation
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password321' } });
    
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });
});
