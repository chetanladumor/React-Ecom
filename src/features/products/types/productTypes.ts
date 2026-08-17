/**
 * @file src/features/products/types/productTypes.ts
 * @description Type definitions for the product catalog domain.
 */

export interface ProductRating {
  rate: number;
  count: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: ProductRating;
}
