/**
 * @file src/features/products/components/ProductSkeleton.tsx
 * @description Loading skeleton components for products listing cards and detail page.
 *
 * @why-it-exists
 * Improves loading state transitions, preventing page layout shifts and maintaining a premium look.
 */

interface ProductSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export default function ProductSkeleton({ count = 8, viewMode = 'grid' }: ProductSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item}
            className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-4 animate-pulse dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row"
          >
            <div className="h-40 w-full shrink-0 rounded-xl bg-neutral-200 dark:bg-neutral-800 sm:w-40" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-1/6 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item}
          className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-4 animate-pulse dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-4 flex-1 space-y-3">
            <div className="h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
