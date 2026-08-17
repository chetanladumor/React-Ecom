/**
 * @file src/routes/AppRoutes.tsx
 * @description Application Routing configuration mapping URLs to lazy-loaded components.
 *
 * @why-it-exists
 * Serves as the central navigation route registry. It maps URLs to layouts and specific page components 
 * using React Router v7.
 *
 * @why-this-approach
 * - Uses nested routes to inherit layout wrappers (MainLayout, AuthLayout) automatically.
 * - Imports page components via `React.lazy` to implement Route-based Code Splitting.
 * - Wraps routes in a central `Suspense` block to handle network delay loading indicators gracefully.
 *
 * @alternative-approaches
 * - Standard synchronous imports: Increases the main bundle size significantly, which degrades initial loading speed 
 *   (Lighthouse score impact).
 * - React Router config objects: While v7 supports file-system routing and configuration objects, declaring routes 
 *   jsx-style is highly readable and standard for SPAs.
 *
 * @enterprise-considerations
 * - Code Splitting: Breaks pages into individual JS bundles loaded only when a user navigates to that path.
 * - Protected Routes: We will add custom middleware route guards (like `<ProtectedRoute />`) around pages 
 *   like Profile and Orders in Phase 3.
 *
 * @react-commentaries
 * - Why lazy loading is used: Each sub-page is lazy-loaded because it contains domain-specific UI components 
 *   (like forms, grids, tables) that are not needed immediately on initial application launch.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import PageLoader from '@/components/PageLoader';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

// Lazy-loaded page components (Code Splitting)
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Main Customer Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          
          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
        </Route>

        {/* Authentication Card Layout Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* 404 Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
