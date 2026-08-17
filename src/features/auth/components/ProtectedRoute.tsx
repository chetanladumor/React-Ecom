/**
 * @file src/features/auth/components/ProtectedRoute.tsx
 * @description Routing guard component enforcing authentication and Role-Based Access Control (RBAC).
 *
 * @why-it-exists
 * Secures application routes. Intercepts navigation attempts to private views and 
 * ensures users possess the required authentication tokens and permissions before rendering.
 *
 * @why-this-approach
 * - Uses Redux selector (`useAppSelector`) to read auth states dynamically.
 * - Leverages React Router's `<Navigate>` component for declaratively forwarding unauthorized users.
 * - Saves the user's current route inside the `state.from` coordinate, allowing seamless redirect back 
 *   to their initial destination after signing in.
 * - Evaluates role specifications via an `allowedRoles` filter.
 *
 * @enterprise-considerations
 * - Role-Based Routing (RBAC): Prevents standard users from requesting admin dashboards or settings.
 * - User notifications: Automatically fires warning notifications to the screen-toast queue when role checks fail.
 */

import { Navigate, useLocation, Outlet } from 'react-router';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addNotification } from '@/store/slices/notificationSlice';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'user')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // 1. If not authenticated, redirect to /login and preserve destination location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If authenticated but roles check is specified and fails
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Dispatch alert warning of unauthorized access
    dispatch(
      addNotification({
        type: 'warning',
        message: 'Access Denied: You do not have permissions to view this resource.',
      })
    );

    // Redirect to home catalog page
    return <Navigate to="/products" replace />;
  }

  // 3. Otherwise, render nested children
  return <Outlet />;
}
