/**
 * @file backend/auth-service/src/validators/auth.validator.ts
 * 
 * @why-file-exists
 * Intercepts incoming HTTP requests to validate and parse payloads before executing business logic 
 * in our controllers/services.
 * 
 * @why-pattern-selected
 * Schema-based request validation using Zod. Provides strict type-safety by validating structure, 
 * sanitizing values (trimming/lowercase), and rejecting malformed inputs instantly.
 * 
 * @alternative-approaches
 * - Manual validation statements in controllers: Clutters business logic, prone to validation gaps.
 * - Joi / express-validator: Joi is good, but Zod integrates natively with TypeScript types.
 * 
 * @performance-impact
 * Negligible. Validation runs completely in-memory in microsecond bounds.
 * 
 * @scaling-considerations
 * By rejecting bad requests at the controller entry point, we prevent un-sanitized data from hitting 
 * downstream databases or wasting CPU on cryptographic checks (e.g. bcrypt hashing).
 */

import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  firstname: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name is required')
    .trim(),
  lastname: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name is required')
    .trim(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(5, 'Phone number must be at least 5 digits')
    .trim(),
});

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(1, 'Username is required')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(4, 'Password must be at least 4 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }),
});
