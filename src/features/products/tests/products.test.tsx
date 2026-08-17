/**
 * @file src/features/products/tests/products.test.tsx
 * @description Unit tests for the productsSlice reducer.
 */

import { describe, it, expect } from 'vitest';
import productsReducer, {
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  toggleViewMode,
  resetFilters,
  type ProductsState,
} from '../slice/productsSlice';

describe('productsSlice', () => {
  const initialState: ProductsState = {
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'default',
    viewMode: 'grid',
  };

  it('should return the initial state', () => {
    expect(productsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setSearchQuery', () => {
    const state = productsReducer(initialState, setSearchQuery('electronics'));
    expect(state.searchQuery).toBe('electronics');
  });

  it('should handle setSelectedCategory', () => {
    const state = productsReducer(initialState, setSelectedCategory('jewelery'));
    expect(state.selectedCategory).toBe('jewelery');
  });

  it('should handle setSortBy', () => {
    const state = productsReducer(initialState, setSortBy('price-asc'));
    expect(state.sortBy).toBe('price-asc');
  });

  it('should handle toggleViewMode', () => {
    let state = productsReducer(initialState, toggleViewMode());
    expect(state.viewMode).toBe('list');

    state = productsReducer(state, toggleViewMode());
    expect(state.viewMode).toBe('grid');
  });

  it('should handle resetFilters', () => {
    const modifiedState: ProductsState = {
      searchQuery: 'jacket',
      selectedCategory: 'clothing',
      sortBy: 'price-desc',
      viewMode: 'list',
    };

    const state = productsReducer(modifiedState, resetFilters());
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBe('all');
    expect(state.sortBy).toBe('default');
    expect(state.viewMode).toBe('list'); // View mode preference should be preserved
  });
});
