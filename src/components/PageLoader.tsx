/**
 * @file src/components/PageLoader.tsx
 * @description Central fallback spinner loader component for React Suspense transitions.
 *
 * @why-it-exists
 * Displays a non-blocking loading state when lazy-loaded route chunks are fetched over the network.
 *
 * @why-this-approach
 * - Styled with a circular SVG spinner that animates infinitely.
 * - Centered on screen, dark-mode compatible, and respects accessibility guidelines (contains a screen-reader loading label).
 *
 * @enterprise-considerations
 * - Smooth state transitions: Prevents sudden layout shifting by taking up the full layout viewport height.
 */

export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner SVG */}
        <svg
          className="h-10 w-10 animate-spin text-brand-600 dark:text-brand-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="status"
          aria-label="Loading page content"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Loading page...
        </span>
      </div>
    </div>
  );
}
