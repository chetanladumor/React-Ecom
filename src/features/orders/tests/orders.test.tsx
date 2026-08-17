/**
 * @file src/features/orders/tests/orders.test.tsx
 * @description Unit tests for ordersSlice actions and state reductions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ordersReducer, { createOrder, type OrdersState } from '../slice/ordersSlice';
import type { OrderItem } from '../types/orderTypes';

const mockItems: OrderItem[] = [
  {
    productId: 1,
    productTitle: 'Mock Product 1',
    productImage: 'https://fakestoreapi.com/img/mock.jpg',
    price: 49.99,
    quantity: 2,
  },
];

describe('ordersSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const initialState: OrdersState = {
    orders: [],
  };

  it('should return initial state', () => {
    expect(ordersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should create an order with status processing and generated ID', () => {
    const shippingAddress = {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    };

    const actionPayload = {
      items: mockItems,
      subtotal: 99.98,
      tax: 8.0,
      shipping: 0,
      total: 107.98,
      shippingAddress,
      paymentMethod: 'Credit Card (ending in 1234)',
    };

    const state = ordersReducer(initialState, createOrder(actionPayload));

    expect(state.orders).toHaveLength(1);
    const order = state.orders[0];

    expect(order.id).toMatch(/^ORD-\d+-\d+$/);
    expect(order.status).toBe('processing');
    expect(order.subtotal).toBe(99.98);
    expect(order.items).toEqual(mockItems);
    expect(order.shippingAddress).toEqual(shippingAddress);
    expect(order.date).toBeDefined();
    expect(new Date(order.date).getTime()).not.toBeNaN();
  });
});
