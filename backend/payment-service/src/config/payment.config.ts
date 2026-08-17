/**
 * @file backend/payment-service/src/config/payment.config.ts
 * 
 * @why-file-exists
 * Exposes environment configurations for the Payment Service, such as MongoDB URIs, 
 * RabbitMQ host URLs, and ports.
 * 
 * @why-pattern-selected
 * Object-oriented configuration module. Centralizes and parses settings once during server initialization.
 * 
 * @alternative-approaches
 * - Reading process.env directly inside controllers: Harder to test and configure.
 * 
 * @performance-impact
 * Negligible. Evaluated once during startup.
 * 
 * @scaling-considerations
 * Fits containerization patterns (Docker) where settings change dynamically between Dev, Staging, and Production.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3007', 10),
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/eshop_payment',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
};
