/**
 * @file src/features/auth/types/authSchemas.ts
 * @description Zod schema definitions and TypeScript types for authentication forms.
 *
 * @why-it-exists
 * Provides centralized validation definitions. These schemas run in the browser 
 * to intercept invalid submissions before they hit the server, saving roundtrip times.
 *
 * @why-this-approach
 * - Uses Zod validation which provides a fluent, type-safe API for defining rules.
 * - Separates base schemas from refinement schemas (`registerBaseSchema` vs `registerSchema`) 
 *   so that inferred forms types are clean ZodObject shapes (resolves React Hook Form resolver mismatches).
 *
 * @enterprise-considerations
 * - Strict type-safety: Prevents data mismatch bugs when passing form results to API mutation hooks.
 */

import { z } from 'zod';

// Login Validation Schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .trim(),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters'), // Fake Store API uses shorter test passwords
});

// Infer Login type definition
export type LoginInput = z.infer<typeof loginSchema>;

// Base Registration Schema representing form inputs structure
export const registerBaseSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  firstname: z
    .string()
    .min(1, 'First name is required')
    .trim(),
  lastname: z
    .string()
    .min(1, 'Last name is required')
    .trim(),
  phone: z
    .string()
    .min(5, 'Phone number must be at least 5 digits')
    .trim(),
  city: z
    .string()
    .min(1, 'City is required')
    .trim(),
  street: z
    .string()
    .min(1, 'Street is required')
    .trim(),
  number: z
    .coerce
    .number()
    .min(1, 'House number must be 1 or higher'),
  zipcode: z
    .string()
    .min(1, 'Zipcode is required')
    .trim(),
});

// Registration Refinement Schema (adds cross-field password matching rules)
export const registerSchema = registerBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Infer Registration type definition from base schema to avoid ZodEffects conflicts
export type RegisterInput = z.infer<typeof registerBaseSchema>;
