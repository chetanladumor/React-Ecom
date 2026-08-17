/**
 * @file src/services/api.ts
 * @description Root RTK Query Base API service with simulated JWT rotation.
 *
 * @why-it-exists
 * Establishes a single centralized API service containing base URL configurations, headers, and tag definitions.
 * All feature modules inject their specific endpoints into this base service, supporting code-splitting 
 * and maintaining modular architecture.
 *
 * @why-rtk-query-concepts
 * 
 * 1. CACHING:
 *    RTK Query automatically caches response data in a Redux sub-store. Caching is keyed by the endpoint name 
 *    and serialized arguments. If a component requests data that already exists in the cache, RTK Query 
 *    returns the cached data and suppresses duplicate network requests.
 * 
 * 2. TAGS & INVALIDATIONS:
 *    Tags (like 'Product', 'Cart') are labels assigned to cache segments. Query endpoints "provide" tags, while 
 *    mutation endpoints "invalidate" tags. When a mutation is executed and invalidates a tag, RTK Query 
 *    automatically re-fetches any active queries that provide that tag.
 * 
 * 3. OPTIMISTIC UPDATES:
 *    Instead of waiting for a server confirmation (which introduces UI lag), we immediately update the local 
 *    Redux cache with the expected mutation result (e.g., adding an item to the cart). If the request fails, 
 *    we rollback the cache to its previous state.
 * 
 * 4. POLLING:
 *    Allows query hooks to run at fixed time intervals (e.g., `pollingInterval: 30000`). Used for updating real-time 
 *    or frequently changing server-side statistics (like cart notifications or system health metrics).
 * 
 * 5. PREFETCHING:
 *    Allows fetching data before it is rendered (e.g., fetching a product's details when a user hovers over its 
 *    card in a list). This eliminates perceived loading lag when the user eventually clicks the item.
 *
 * @why-this-approach
 * - Uses `fetchBaseQuery` as the core HTTP fetch engine.
 * - Wraps `fetchBaseQuery` with a custom `baseQueryWithReauth` middleware to intercept requests, detect simulated 
 *   session expirations (using `tokenExpiresAt` from Redux), execute a mock refresh token call, and retry queries.
 *
 * @enterprise-considerations
 * - Request Interception: Configures custom headers (such as authorization tokens) dynamically before each request.
 * - Centralized Error Handling: Can be hooked into middleware to display global notifications for all API failures.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/store/index.ts';
import { updateTokens, logout } from '@/features/auth/slice/authSlice';
import { addNotification } from '@/store/slices/notificationSlice';

// Base fetch query referencing our API Gateway
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5010',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Mutex for concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

// Custom wrapper simulating JWT Access/Refresh Token rotation pre-flight & post-response
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiInstance, extraOptions) => {
  const state = apiInstance.getState() as RootState;
  const { accessToken, refreshToken, tokenExpiresAt } = state.auth;

  // Helper to perform real network refresh with Mutex to prevent race conditions
  const performRealRefresh = async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          apiInstance,
          extraOptions
        );

        if (refreshResult.data) {
          const data = refreshResult.data as any;
          const newAccessToken = data.data?.accessToken || data.accessToken;
          const newRefreshToken = data.data?.refreshToken || data.refreshToken;
          
          if (newAccessToken && newRefreshToken) {
            apiInstance.dispatch(updateTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }));
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  // 1. Pre-flight simulation check: Is the access token expired?
  if (accessToken && tokenExpiresAt && Date.now() > tokenExpiresAt) {
    console.log('[Auth API Interceptor] Access token expired. Refreshing token...');

    if (refreshToken) {
      const success = await performRealRefresh();
      if (!success) {
        apiInstance.dispatch(logout());
        return { error: { status: 401, statusText: 'Unauthorized', data: { message: 'Token refresh failed' } } };
      }
    } else {
      apiInstance.dispatch(logout());
      apiInstance.dispatch(addNotification({ type: 'error', message: 'Your session has expired. Please sign in again.' }));
      return { error: { status: 401, statusText: 'Unauthorized', data: { message: 'Session expired' } } };
    }
  }

  // 2. Perform the initial query request
  let result = await baseQuery(args, apiInstance, extraOptions);

  // 3. Post-response check: Handle token expiration if returned by server (401 Unauthorized)
  const isAuthEndpoint = typeof args === 'string' 
    ? args.includes('/auth/login') || args.includes('/auth/register')
    : args.url.includes('/auth/login') || args.url.includes('/auth/register');

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    console.warn('[Auth API Interceptor] Server returned 401 Unauthorized. Retrying with refresh...');
    
    if (refreshToken) {
      const success = await performRealRefresh();
      if (success) {
        result = await baseQuery(args, apiInstance, extraOptions);
      } else {
        apiInstance.dispatch(logout());
        apiInstance.dispatch(addNotification({ type: 'error', message: 'Session expired. Please sign in again.' }));
      }
    } else {
      apiInstance.dispatch(logout());
      apiInstance.dispatch(addNotification({ type: 'error', message: 'Session expired. Please sign in again.' }));
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Tags represent entities stored in the cache. They are utilized to determine when query cache invalidation should trigger.
  tagTypes: ['Product', 'Cart', 'User', 'Order'],
  endpoints: () => ({}), // Endpoints are injected by feature slices for modular compilation (code-splitting)
});
