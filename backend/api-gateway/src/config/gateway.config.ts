/**
 * @file backend/api-gateway/src/config/gateway.config.ts
 * 
 * @why-file-exists
 * Consolidates all environment variables, security configurations, and routing targets 
 * in a central config file. This decouples logic from environment configurations.
 * 
 * @why-pattern-selected
 * Object-oriented configuration module. Isolates config validation from environment loading.
 * 
 * @alternative-approaches
 * - Reading process.env directly inside controllers: Anti-pattern. Leads to scattered environment checks, 
 *   makes unit testing difficult, and delays validation of missing values until runtime execution.
 * 
 * @performance-impact
 * Negligible. Configurations are parsed and loaded once during gateway initialization.
 * 
 * @scaling-considerations
 * Allows running the same service image across Dev, Staging, and Production environments by simply 
 * modifying container environment variables.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'eshop_super_secure_jwt_secret_key_12345',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5110',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per window
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3004',
    wishlist: process.env.WISHLIST_SERVICE_URL || 'http://localhost:3006',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
    reviews: process.env.REVIEW_SERVICE_URL || 'http://localhost:3009',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010',
  },
};
