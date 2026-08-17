/**
 * @file src/features/products/slice/productsSlice.ts
 * @description Redux slice for managing catalog search keywords, categories, and display view configurations.
 *
 * @why-it-exists
 * Provides client-side state for catalog filtering and sorting preferences. 
 * Separating filtering state from API queries allows for high-performance offline filtering.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';
export type ViewMode = 'grid' | 'list';

export interface ProductsState {
  searchQuery: string;
  selectedCategory: string;
  sortBy: SortOption;
  viewMode: ViewMode;
}

const initialState: ProductsState = {
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'default',
  viewMode: 'grid',
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
      state.sortBy = 'default';
    },
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  toggleViewMode,
  resetFilters,
} = productsSlice.actions;

export default productsSlice.reducer;
