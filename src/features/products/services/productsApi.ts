/**
 * @file src/features/products/services/productsApi.ts
 * @description Injects product catalog search/fetching endpoints into the central RTK Query base API.
 *
 * @why-it-exists
 * Declares domain-specific product queries dynamically. Keeps the central API config 
 * modular and supports lazy compilation.
 */

import { api } from '@/services/api';
import type { Product } from '../types/productTypes';

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Query to fetch all products
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
      transformResponse: (response: any[]) => {
        return response.map((item) => ({
          ...item,
          id: item.id || item._id,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // Query to fetch details of a single product by ID
    getProductById: builder.query<Product, number | string>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: any) => {
        return {
          ...response,
          id: response.id || response._id,
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    // Query to fetch all categories
    getCategories: builder.query<string[], void>({
      query: () => '/products/categories',
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
} = productsApi;
