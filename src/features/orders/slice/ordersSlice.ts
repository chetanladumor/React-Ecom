/**
 * @file src/features/orders/slice/ordersSlice.ts
 * @description Redux slice for managing customer order history state.
 *
 * @why-it-exists
 * Persists placed orders and transaction histories locally.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Order } from '../types/orderTypes';

export interface OrdersState {
  orders: Order[];
}

const loadOrdersFromStorage = (): Order[] => {
  try {
    const stored = localStorage.getItem('eshop_orders');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load orders from storage:', error);
    return [];
  }
};

const saveOrdersToStorage = (orders: Order[]) => {
  try {
    localStorage.setItem('eshop_orders', JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders to storage:', error);
  }
};

const initialState: OrdersState = {
  orders: loadOrdersFromStorage(),
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    createOrder: (
      state,
      action: PayloadAction<Omit<Order, 'id' | 'date' | 'status'>>
    ) => {
      const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
        Math.random() * 1000
      )}`;
      const orderDate = new Date().toISOString();
      
      const newOrder: Order = {
        ...action.payload,
        id: orderId,
        date: orderDate,
        status: 'processing',
      };

      state.orders.unshift(newOrder); // Add to the beginning of the list
      saveOrdersToStorage(state.orders);
    },
  },
});

export const { createOrder } = ordersSlice.actions;

export default ordersSlice.reducer;
