/**
 * @file src/store/slices/themeSlice.ts
 * @description Theme configuration slice managing light and dark modes.
 *
 * @why-it-exists
 * Provides state management and helper methods to load, switch, and persist the theme (light vs dark mode) 
 * in the client browser, updating DOM class elements accordingly.
 *
 * @why-this-approach
 * - Uses `createSlice` to group state mutations cleanly.
 * - Syncs with localStorage so the user's theme selection is preserved across sessions.
 * - Directly changes the `html` document's class list during theme updates.
 *
 * @alternative-approaches
 * - Context-based themes: Context works, but placing it in the global Redux store keeps all global state unified,
 *   making it easy to read from/react to theme states in other slices if needed.
 *
 * @enterprise-considerations
 * - System preference detection: Standardizes on the system preference (`prefers-color-scheme`) if the user 
 *   has not manually selected a theme yet.
 */

import { createSlice } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Fallback to system preference query
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  }
  return 'light';
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      updateHtmlTheme(state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      updateHtmlTheme(state.mode);
    },
  },
});

// Helper function to update class on the html element (used by Tailwind v4 dark class detector)
export const updateHtmlTheme = (mode: ThemeMode) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
