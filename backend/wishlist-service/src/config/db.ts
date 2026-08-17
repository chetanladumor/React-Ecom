/**
 * @file backend/wishlist-service/src/config/db.ts
 * 
 * @why-file-exists
 * Establishes and manages the connection lifecycle between the Wishlist Service and MongoDB.
 * 
 * @why-pattern-selected
 * Mongoose Singleton Connection pool pattern. Ensures single client connection reuse.
 * 
 * @alternative-approaches
 * - Direct raw client initialization on each request: Highly inefficient.
 * 
 * @performance-impact
 * Manages connection pooling internally.
 * 
 * @scaling-considerations
 * Connects via replica sets in production for high availability.
 */

import mongoose from 'mongoose';
import { config } from './wishlist.config';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('Wishlist Database successfully connected.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Wishlist Database connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Wishlist Database connection disconnected.');
    });

    await mongoose.connect(config.mongoUri);
  } catch (error) {
    logger.error('Failed to connect to MongoDB cluster:', error);
    process.exit(1);
  }
};
