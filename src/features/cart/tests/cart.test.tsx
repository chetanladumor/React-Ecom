/**
 * @file src/features/cart/tests/cart.test.tsx
 * @description Unit tests for cartSlice actions and state reductions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  type CartState,
} from '../slice/cartSlice';
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

describe('cartSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const initialState: CartState = {
    items: [],
  };

  it('should return initial state', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addToCart', () => {
    const state = cartReducer(initialState, addToCart({ product: mockProduct, quantity: 2 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({ product: mockProduct, quantity: 2 });
  });

  it('should increment quantity on subsequent addToCart calls', () => {
    let state = cartReducer(initialState, addToCart({ product: mockProduct, quantity: 1 }));
    state = cartReducer(state, addToCart({ product: mockProduct, quantity: 3 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(4);
  });

  it('should handle removeFromCart', () => {
    const populatedState: CartState = {
      items: [
        { product: mockProduct, quantity: 1 },
        { product: mockProduct2, quantity: 2 },
      ],
    };
    const state = cartReducer(populatedState, removeFromCart(1));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe(2);
  });

  it('should handle updateQuantity', () => {
    const populatedState: CartState = {
      items: [{ product: mockProduct, quantity: 2 }],
    };
    const state = cartReducer(populatedState, updateQuantity({ productId: 1, quantity: 5 }));
    expect(state.items[0].quantity).toBe(5);
  });

  it('should remove item when updateQuantity is 0 or less', () => {
    const populatedState: CartState = {
      items: [{ product: mockProduct, quantity: 2 }],
    };
    const state = cartReducer(populatedState, updateQuantity({ productId: 1, quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it('should handle clearCart', () => {
    const populatedState: CartState = {
      items: [
        { product: mockProduct, quantity: 1 },
        { product: mockProduct2, quantity: 2 },
      ],
    };
    const state = cartReducer(populatedState, clearCart());
    expect(state.items).toHaveLength(0);
  });
});
