/**
 * @file backend/notification-service/src/config/notification.config.ts
 * 
 * @why-file-exists
 * Exposes environment configurations for the Notification Service, such as RabbitMQ host URLs 
 * and healthcheck ports.
 * 
 * @why-pattern-selected
 * Object-oriented configuration module. Centralizes and parses settings once during server initialization.
 * 
 * @alternative-approaches
 * - Reading process.env directly: Harder to test and configure.
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
  port: parseInt(process.env.PORT || '3008', 10),
  env: process.env.NODE_ENV || 'development',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
};
