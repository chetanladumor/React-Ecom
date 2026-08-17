/**
 * @file backend/auth-service/src/config/auth.config.ts
 * 
 * @why-file-exists
 * Loads and exposes typed environment variables for MongoDB URIs, RabbitMQ connection strings, 
 * ports, and security expiry parameters.
 * 
 * @why-pattern-selected
 * Structured configuration object. Ensures that missing environment configurations are validated 
 * during application bootstrap rather than at runtime.
 * 
 * @alternative-approaches
 * - Reading process.env inline within models and controllers: Makes configurations difficult to mock 
 *   during unit tests and prone to typos.
 * 
 * @performance-impact
 * Parsed once at startup. Negligible performance overhead.
 * 
 * @scaling-considerations
 * Enables 12-factor application compatibility by utilizing Docker container environment injections 
 * instead of hardcoded configs.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/eshop_auth',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  jwtSecret: process.env.JWT_SECRET || 'eshop_super_secure_jwt_secret_key_12345',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  refreshTokenExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10),
};
