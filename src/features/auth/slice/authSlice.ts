/**
 * @file src/features/auth/slice/authSlice.ts
 * @description Redux slice for managing client-side authentication and session states.
 *
 * @why-it-exists
 * Stores active session profiles, JWT access/refresh credentials, and authorization roles.
 * Provides a single source of truth for checking user status and managing secure states.
 *
 * @why-this-approach
 * - Uses in-memory state for `accessToken` (security best practice).
 * - Restores sessions from `localStorage` on bootstrap for user convenience.
 *
 * @alternative-approaches
 * - Storing all tokens in cookies: A good approach, but since Fake Store API runs entirely in the cloud,
 *   we cannot set secure HttpOnly cookies from our client-side app directly. Storing the refresh token 
 *   in localStorage simulates a token database.
 *
 * @enterprise-considerations
 * - Role-Based Access Control (RBAC): Encodes the user's role directly in the state, allowing pages and layout gates 
 *   to determine access privileges.
 * - React 19 safety: Minimizes mutative dependencies by returning immutable state changes.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: {
    firstname: string;
    lastname: string;
  };
  role: 'admin' | 'user';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null; // expiry timestamp in ms
}

// Read initial session state from localStorage
const getStoredSession = (): AuthState => {
  try {
    const session = localStorage.getItem('eshop_session');
    if (session) {
      const parsed = JSON.parse(session);
      return {
        isAuthenticated: true,
        user: parsed.user,
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        tokenExpiresAt: parsed.tokenExpiresAt || null,
      };
    }
  } catch (error) {
    console.error('Failed to parse stored session:', error);
  }

  return {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
  };
};

const initialState: AuthState = getStoredSession();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      const expiry = Date.now() + 60000; // Simulated 1 minute expiry for testing refresh token rotation

      state.isAuthenticated = true;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.tokenExpiresAt = expiry;

      // Persist to localStorage
      try {
        localStorage.setItem(
          'eshop_session',
          JSON.stringify({ user, accessToken, refreshToken, tokenExpiresAt: expiry })
        );
      } catch (error) {
        console.error('Failed to persist session:', error);
      }
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      const expiry = Date.now() + 60000; // Extend mock expiry by 1 minute

      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiresAt = expiry;

      // Update stored session as well
      try {
        const session = localStorage.getItem('eshop_session');
        if (session) {
          const parsed = JSON.parse(session);
          parsed.accessToken = action.payload.accessToken;
          parsed.refreshToken = action.payload.refreshToken;
          parsed.tokenExpiresAt = expiry;
          localStorage.setItem('eshop_session', JSON.stringify(parsed));
        }
      } catch (error) {
        console.error('Failed to update persisted access token:', error);
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenExpiresAt = null;

      try {
        localStorage.removeItem('eshop_session');
      } catch (error) {
        console.error('Failed to clear session from storage:', error);
      }
    },
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
