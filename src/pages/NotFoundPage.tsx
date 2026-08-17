/**
 * @file src/pages/NotFoundPage.tsx
 * @description 404 Fallback page.
 */

import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight text-neutral-400 dark:text-neutral-600">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
      >
        Go back home
      </Link>
    </div>
  );
}
