/**
 * @file src/pages/ProductsPage.tsx
 * @description Products Catalog listings view.
 *
 * @why-it-exists
 * Connects the product listing UI with our store state, managing filtering, 
 * sorting, search results, and layout preferences.
 */

import { useEffect, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetProductsQuery } from '@/features/products/services/productsApi';
import ProductFilters from '@/features/products/components/ProductFilters';
import ProductCard from '@/features/products/components/ProductCard';
import ProductSkeleton from '@/features/products/components/ProductSkeleton';
import { ShoppingBag } from 'lucide-react';

export default function ProductsPage() {
  // Read active filters and layout preferences from Redux
  const { searchQuery, selectedCategory, sortBy, viewMode } = useAppSelector(
    (state) => state.products
  );

  // Set page meta title for SEO
  useEffect(() => {
    document.title = 'Products Catalog | E-SHOP';
  }, []);

  // Fetch products list from RTK Query cache/server
  const { data: products = [], isLoading, isError, error } = useGetProductsQuery();

  // Perform dynamic filtering and sorting of catalog items
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(
        (product) => product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Filter by search keyword
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    // 3. Apply sorting criteria
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => b.rating.rate - a.rating.rate);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Catalog Title Section */}
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">Products Catalog</h1>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Browse our curated catalog of high-quality products.
        </p>
      </div>

      {/* Filter and Sorting Controls */}
      <ProductFilters />

      {/* Products Grid / Listing Block */}
      {isLoading ? (
        <ProductSkeleton viewMode={viewMode} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/20 p-8 text-center dark:border-red-950/30">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Failed to load products.
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {error && 'message' in error ? error.message : 'Please check your connection.'}
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 px-4 text-center dark:border-neutral-800/80 dark:bg-neutral-900/40">
          <div className="rounded-full bg-neutral-50 p-4 text-neutral-400 dark:bg-neutral-850">
            <ShoppingBag size={32} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">No Products Found</h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            We couldn't find any products matching "{searchQuery}" in this category. Try adjusting your filters.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
