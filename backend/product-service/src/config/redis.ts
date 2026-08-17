/**
 * @file backend/product-service/src/config/redis.ts
 * 
 * @why-file-exists
 * Initializes and manages the connection lifecycle for Redis, which acts as our distributed cache.
 * 
 * @why-pattern-selected
 * Singleton client connection instance. Shares the open TCP connection pool with Redis across 
 * all asynchronous request handlers.
 * 
 * @alternative-approaches
 * - Instantiating new Redis connections per lookup: Wasteful, runs out of file descriptors.
 * - In-memory cache (like node-cache): Limits scalability because the cache is not shared 
 *   between multiple instances of the Product Service.
 * 
 * @performance-impact
 * Enables caching product details. Bypasses MongoDB disk reads and deserialization.
 * 
 * @scaling-considerations
 * Connects to Redis clusters or sentinel hosts in production, handling failovers automatically.
 */

import { createClient } from 'redis';
import { config } from './product.config';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on('connect', () => {
  logger.info('Connecting to Redis Cache...');
});

redisClient.on('ready', () => {
  logger.info('Redis Cache successfully connected and ready.');
});

redisClient.on('error', (err) => {
  logger.error(`Redis Cache connection error: ${err.message}`);
});

redisClient.on('end', () => {
  logger.warn('Redis Cache connection disconnected.');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis cache cluster:', error);
    // In production, we might log and continue (falling back to database-only queries) 
    // to prevent Redis outages from taking down the entire catalog service (Resiliency pattern).
  }
};
