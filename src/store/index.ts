/**
 * @file src/store/index.ts
 * @description Root Redux Store configuration for the E-Commerce application.
 *
 * @why-redux-toolkit-selected
 * Redux Toolkit (RTK) is the official, opinionated, battery-included toolset for efficient Redux development.
 * It was selected because:
 * 1. Boilerplate reduction: Eliminates manual action creator, action type, and reducer setups.
 * 2. Immutable state by default: Uses Immer internally, letting us write "mutative" syntax that safely translates to immutable updates.
 * 3. Default middleware: Configures redux-thunk and devTools out-of-the-box.
 * 4. RTK Query integration: Simplifies API cache middleware attachment.
 *
 * @why-create-slice-exists
 * `createSlice` is a helper function that accepts an initial state, an object of reducer functions, and a "slice name".
 * It automatically generates action creators and action types that correspond to the reducers and state. This avoids
 * the traditional Redux issue of having to synchronize actions, types, and reducers across separate files.
 *
 * @why-create-async-thunk-exists
 * `createAsyncThunk` simplifies running asynchronous side effects (like fetch requests) and dispatching lifecycle actions
 * (pending, fulfilled, rejected). Rather than writing custom thunk middleware or manual dispatch sequences, it standardizes
 * how promises are handled within slices (often handled in `extraReducers`).
 *
 * @why-rtk-query-exists
 * RTK Query is an advanced data fetching and caching tool built on top of Redux. It handles:
 * 1. Server cache management: Tracks and stores response data.
 * 2. Auto-deduplication: Prevents duplicate requests for the same endpoint with the same arguments.
 * 3. Cache lifetimes: Cleans up data when components unmount.
 * 4. Declarative hooks: Generates auto-running React hooks from endpoints.
 *
 * @when-not-to-use-redux
 * Do not use Redux for:
 * 1. Local UI state: Dropdown opens, drawer collapses, local hover triggers. Keep these in React's `useState`.
 * 2. Short-lived form state: Form inputs and typing states. Storing these in Redux causes unnecessary re-renders. Use `react-hook-form` or local state.
 * 3. Isolated single-component data: If a data query is only used in a single leaf component and nowhere else, using standard fetching or local states is preferred over global store pollution.
 *
 * @why-this-approach
 * We configure a single centralized configureStore that aggregates our slice reducers and attaches the RTK Query API middleware.
 *
 * @alternative-approaches
 * - Context API: Good for small apps, but lacks middle-ware hooks, has performance bottlenecks (re-renders entire context consumer tree on any property change), and lacks structured debugging (Redux DevTools).
 * - Zustand / MobX: Great lightweight state managers, but Redux is preferred in large enterprise companies due to its strict, predictable conventions and ecosystem standardization.
 *
 * @enterprise-considerations
 * - Middleware: RTK Query middleware is appended to manage caching lifecycle.
 * - DevTools: DevTools are enabled in development but can be disabled in production for security and performance.
 */

import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import themeReducer from './slices/themeSlice';
import notificationReducer from './slices/notificationSlice';
import authReducer from '@/features/auth/slice/authSlice';
import productsReducer from '@/features/products/slice/productsSlice';
import cartReducer from '@/features/cart/slice/cartSlice';
import wishlistReducer from '@/features/wishlist/slice/wishlistSlice';
import ordersReducer from '@/features/orders/slice/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    notification: notificationReducer,
    products: productsReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific RTK Query actions or headers if needed.
      },
    }).concat(api.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

// Infer RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
