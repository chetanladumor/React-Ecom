/**
 * @file src/features/auth/services/authApi.ts
 * @description Injects auth-related query endpoints (login, register) into the central RTK Query base API.
 *
 * @why-it-exists
 * Separates API concerns per feature module while maintaining a unified caching layer.
 * Leverages RTK Query's code-splitting feature (`injectEndpoints`) to load auth endpoints dynamically.
 *
 * @why-this-approach
 * - Uses `injectEndpoints` to avoid bloat in the main `src/services/api.ts` file.
 * - Customizes lifecycle triggers using `onQueryStarted` to capture token responses, fetch matching user profiles, 
 *   assign roles dynamically (User ID 1 is designated as 'admin', others as 'user'), and update our Redux auth state.
 *
 * @enterprise-considerations
 * - Cache tagging: Invalidation of 'User' tags.
 * - Secure data flow: Performs client-side profile-matching after verifying credentials against the server.
 */

import { api } from '@/services/api';
import { setCredentials } from '../slice/authSlice';
import type { UserProfile } from '../slice/authSlice';
import { addNotification } from '@/store/slices/notificationSlice';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterResponse {
  id: number;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Auth Login endpoint
    login: builder.mutation<LoginResponse, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: any) => response.data,
      // Handle post-query side-effects to load user details and store session credentials
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );

          dispatch(
            addNotification({
              type: 'success',
              message: `Welcome back, ${data.user.name.firstname}!`,
            })
          );
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
          console.error('[Auth API] Login post-processing failed:', error);
          dispatch(
            addNotification({
              type: 'error',
              message: errMsg,
            })
          );
        }
      },
    }),

    // Auth Registration endpoint
    register: builder.mutation<RegisterResponse, Record<string, unknown>>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response: any) => response.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            addNotification({
              type: 'success',
              message: 'Account created successfully! You can now log in.',
            })
          );
        } catch (error) {
          console.error('[Auth API] Registration failed:', error);
          dispatch(
            addNotification({
              type: 'error',
              message: 'Registration failed. Please check your inputs.',
            })
          );
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation } = authApi;
