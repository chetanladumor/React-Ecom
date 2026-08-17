/**
 * @file src/features/products/components/ProductFilters.tsx
 * @description Catalog filters, search inputs, sorting, and layout grid/list toggles.
 *
 * @why-it-exists
 * Provides controls for users to query products.
 */

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetCategoriesQuery } from '../services/productsApi';
import {
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  toggleViewMode,
  resetFilters,
  type SortOption,
} from '../slice/productsSlice';
import useDebounce from '@/hooks/useDebounce';
import { Search, Grid, List, RotateCcw, SlidersHorizontal } from 'lucide-react';

export default function ProductFilters() {
  const dispatch = useAppDispatch();
  const { searchQuery, selectedCategory, sortBy, viewMode } = useAppSelector(
    (state) => state.products
  );

  // Local state for search input to keep keystrokes instant
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Fetch categories array from the API
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();

  // Dispatch debounced search changes to Redux store
  useEffect(() => {
    dispatch(setSearchQuery(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  // Sync local search input if Redux state changes externally (like on reset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleCategorySelect = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSortBy(e.target.value as SortOption));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 py-2.5 pr-4 pl-11 text-sm outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
          />
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting Dropdown select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="rounded-xl border border-neutral-200 bg-white py-2 px-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-850 dark:text-white"
            >
              <option value="default">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: High to Low</option>
            </select>
          </div>

          {/* Grid/List View Toggles */}
          <div className="flex items-center rounded-xl border border-neutral-200 p-1 dark:border-neutral-700 dark:bg-neutral-850">
            <button
              onClick={() => viewMode !== 'grid' && dispatch(toggleViewMode())}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
              }`}
              aria-label="Grid view layout"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => viewMode !== 'list' && dispatch(toggleViewMode())}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
              }`}
              aria-label="List view layout"
            >
              <List size={16} />
            </button>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== 'all' || sortBy !== 'default') && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Horizontal scrolling Selector */}
      <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <SlidersHorizontal size={14} className="text-neutral-400 shrink-0" />
          <button
            onClick={() => handleCategorySelect('all')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-850 dark:text-neutral-350 dark:hover:bg-neutral-800'
            }`}
          >
            All Categories
          </button>
          {isLoadingCategories
            ? [1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="h-7 w-20 shrink-0 rounded-full bg-neutral-200 animate-pulse dark:bg-neutral-800"
                />
              ))
            : categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-850 dark:text-neutral-350 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
