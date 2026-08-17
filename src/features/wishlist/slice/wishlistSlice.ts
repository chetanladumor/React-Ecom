/**
 * @file src/features/wishlist/slice/wishlistSlice.ts
 * @description Redux slice for managing the user's wishlist state.
 *
 * @why-it-exists
 * Tracks items saved by the customer for future checkout consideration.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@/features/products/types/productTypes';

export interface WishlistState {
  items: Product[];
}

const loadWishlistFromStorage = (): Product[] => {
  try {
    const stored = localStorage.getItem('eshop_wishlist');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load wishlist from storage:', error);
    return [];
  }
};

const saveWishlistToStorage = (items: Product[]) => {
  try {
    localStorage.setItem('eshop_wishlist', JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save wishlist to storage:', error);
  }
};

const initialState: WishlistState = {
  items: loadWishlistFromStorage(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const exists = state.items.some((item) => item.id === product.id);

      if (exists) {
        state.items = state.items.filter((item) => item.id !== product.id);
      } else {
        state.items.push(product);
      }
      saveWishlistToStorage(state.items);
    },
    removeFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveWishlistToStorage(state.items);
    },
  },
});

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
