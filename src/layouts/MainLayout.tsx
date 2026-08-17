/**
 * @file src/layouts/MainLayout.tsx
 * @description Core shell layout container composed of responsive headers, footers, and page views.
 *
 * @why-it-exists
 * Acts as the template wrapper for standard customer-facing pages (Home, Catalog, Cart, Details).
 * By defining it as a layout route, we avoid repeating header and footer markup across multiple pages.
 *
 * @why-this-approach
 * - Uses React Router v7's `<Outlet />` to render active nested sub-routes dynamically.
 * - Imports theme controls from Redux (`toggleTheme`) and reads theme state.
 *
 * @alternative-approaches
 * - Importing Header/Footer manually on every page container: Leads to high duplication and resets header state on page transitions.
 *
 * @enterprise-considerations
 * - Accessibility (a11y): Uses semantic elements (`<header>`, `<nav>`, `<main>`, `<footer>`), aria-labels for icon buttons, and focus indicators.
 * - Responsive Design: Uses flex/grid options and hidden blocks to toggle mobile navigation layouts.
 *
 * @react-commentaries
 * - Why state belongs in Redux: We read theme (`theme.mode`) from Redux because theme changes affect the entire 
 *   application DOM class list and is a global preference. Local component state would not allow different 
 *   nested UI elements to respond to theme toggles.
 * - Why useCallback/useMemo are not used here: The render tree is lightweight, and the handlers are basic 
 *   dispatches. Adding memoization overhead is unnecessary here since no heavy computational tasks are running 
 *   and no children are memoized with `React.memo`.
 */

import { Link, Outlet } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { logout } from '@/features/auth/slice/authSlice';
import { Sun, Moon, ShoppingCart, Heart, User, LogOut, Menu } from 'lucide-react';

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme.mode);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
              E-SHOP
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
              <Link to="/products" className="hover:text-brand-600 dark:hover:text-brand-400">
                Products
              </Link>
              <Link to="/orders" className="hover:text-brand-600 dark:hover:text-brand-400">
                My Orders
              </Link>
            </nav>
          </div>

          {/* Action Icons & Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              aria-label="Toggle visual theme mode"
            >
              {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Wishlist Link with Badging */}
            <Link
              to="/wishlist"
              className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              aria-label="View wishlist items"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link with Badging */}
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              aria-label="View cart items"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth Controls */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-neutral-200 pl-4 dark:border-neutral-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">
                    {user?.name ? `${user.name.firstname}` : 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  aria-label="Log out session"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Navigation Trigger */}
            <button
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 md:hidden"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer Details */}
      <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-neutral-500 dark:text-neutral-400">
            <p>&copy; {new Date().getFullYear()} E-Shop Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
