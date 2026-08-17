/**
 * @file src/layouts/AuthLayout.tsx
 * @description Centered template layout container for user authentication forms.
 *
 * @why-it-exists
 * Separates authentication views (Login, Registration) from the main shop layout.
 * Removes navigation headers and footer noise, keeping the user focused on the security action.
 *
 * @why-this-approach
 * - Uses flexbox centring (`items-center justify-center`) and full height min-h-screen.
 * - Fits within our layout routing hierarchy, loading nested route forms via `<Outlet />`.
 *
 * @alternative-approaches
 * - Custom layout markup inline inside the LoginPage or RegisterPage: Causes duplication of the main background and card styles.
 *
 * @enterprise-considerations
 * - Branding integration: Centered brand logomark above input frames to maintain corporate design language.
 */

import { Link, Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12 transition-colors duration-300 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col items-center">
          <Link
            to="/"
            className="text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400"
          >
            E-SHOP
          </Link>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Enterprise Client E-Commerce Portal
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
