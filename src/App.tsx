/**
 * @file src/App.tsx
 * @description Application bootstrap component setting up Redux, Routing, and global UI containers.
 *
 * @why-it-exists
 * Binds all global providers (Redux Store Provider, React Router Context Provider) and mounts the route tree
 * along with global visual portals (like Toast notifications).
 *
 * @why-this-approach
 * - Wraps the routing tree in React-Redux `<Provider>` to make state accessible to all components.
 * - Imports `<BrowserRouter>` to enable client-side navigation.
 * - Mounts our global `<ToastContainer />` for notifications.
 *
 * @alternative-approaches
 * - Defining providers in `src/main.tsx`: Also possible, but placing them in App.tsx makes it easier to write
 *   integration wrappers when building tests for the entire application environment.
 *
 * @enterprise-considerations
 * - Theme Initialization: Triggers an effect reading the Redux theme state to synchronize class names on
 *   the document head, avoiding flash-of-unstyled-content (FOUC).
 */

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { useEffect } from 'react';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import AppRoutes from '@/routes/AppRoutes';
import ToastContainer from '@/components/ToastContainer';
import { updateHtmlTheme } from '@/store/slices/themeSlice';

function AppContent() {
  const themeMode = useAppSelector((state) => state.theme.mode);

  // Sync index theme changes to html class properties
  useEffect(() => {
    updateHtmlTheme(themeMode);
  }, [themeMode]);

  return (
    <>
      <ToastContainer />
      <AppRoutes />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

// Test AI Reviewer Trigger
