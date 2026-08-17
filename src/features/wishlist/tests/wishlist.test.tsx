/**
 * @file src/features/wishlist/tests/wishlist.test.tsx
 * @description Unit tests for wishlistSlice actions and state reductions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import wishlistReducer, {
  toggleWishlist,
  removeFromWishlist,
  type WishlistState,
} from '../slice/wishlistSlice';
import type { Product } from '@/features/products/types/productTypes';

const mockProduct: Product = {
  id: 1,
  title: 'Test Jacket',
  price: 59.99,
  description: 'A cozy test jacket.',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/mock.jpg',
  rating: { rate: 4.5, count: 120 },
};

const mockProduct2: Product = {
  id: 2,
  title: 'Test Shoes',
  price: 89.99,
  description: 'Running shoes.',
  category: 'sports',
  image: 'https://fakestoreapi.com/img/mock2.jpg',
  rating: { rate: 4.8, count: 80 },
};

describe('wishlistSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const initialState: WishlistState = {
    items: [],
  };

  it('should return initial state', () => {
    expect(wishlistReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should add product to wishlist on toggle if not present', () => {
    const state = wishlistReducer(initialState, toggleWishlist(mockProduct));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(mockProduct);
  });

  it('should remove product from wishlist on toggle if already present', () => {
    const populatedState: WishlistState = {
      items: [mockProduct],
    };
    const state = wishlistReducer(populatedState, toggleWishlist(mockProduct));
    expect(state.items).toHaveLength(0);
  });

  it('should handle removeFromWishlist', () => {
    const populatedState: WishlistState = {
      items: [mockProduct, mockProduct2],
    };
    const state = wishlistReducer(populatedState, removeFromWishlist(1));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(2);
  });
});
