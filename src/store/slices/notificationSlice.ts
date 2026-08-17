/**
 * @file src/store/slices/notificationSlice.ts
 * @description State slice managing the application's global toast notification queue.
 *
 * @why-it-exists
 * A modern enterprise application requires a non-blocking toast notification system to inform users 
 * of operational updates (e.g., "Item added to cart", "Login failed"). Storing this globally 
 * allows any component or asynchronous thunk/middleware to dispatch notifications easily.
 *
 * @why-this-approach
 * - A list of notification objects is maintained, enabling multiple toasts to stack or render simultaneously.
 * - Actions like `showNotification` automatically generate a unique ID (if not provided) for targeting removals.
 *
 * @alternative-approaches
 * - Local component alert states: Severely limits alerts because they cannot persist across route changes, 
 *   or be fired from API middleware layers.
 * - Single-alert state: Restricts the UI to displaying only one toast at a time. Using an array allows 
 *   rich stackable toast layouts.
 *
 * @enterprise-considerations
 * - Auto-Dismissal: Standardizes dismiss timelines (e.g., 5 seconds) which components map using timeout hooks.
 * - Support for diverse notification types: `success`, `error`, `info`, and `warning`.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // duration in ms
}

interface NotificationState {
  items: NotificationItem[];
}

const initialState: NotificationState = {
  items: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id'>>) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
      state.items.push({
        ...action.payload,
        id,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.items = [];
    },
  },
});

export const { addNotification, removeNotification, clearAllNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
