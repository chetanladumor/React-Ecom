/**
 * @file backend/auth-service/src/config/db.ts
 * 
 * @why-file-exists
 * Establishes and manages the connection lifecycle between the Auth Service and MongoDB.
 * 
 * @why-pattern-selected
 * Mongoose Singleton Connection pattern. Reuses the open client socket connection pool across 
 * the application lifetime rather than opening new connections on every request.
 * 
 * @alternative-approaches
 * - Instantiating new MongoClient connections inside controllers: Highly inefficient. Connection overhead 
 *   (TCP handshake, TLS validation, database authorization) takes 50–100ms and rapidly depletes system sockets.
 * 
 * @performance-impact
 * Handles connection pooling natively. By default, Mongoose manages a pool size of 5–10 active sockets 
 * that handle parallel queries concurrently.
 * 
 * @scaling-considerations
 * Enables connection string customizations (like replica sets, write concern majorities, and read preferences) 
 * which are vital for MongoDB clustering and high-availability sharded deployments.
 */

import mongoose from 'mongoose';
import { config } from './auth.config';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('Auth Database successfully connected.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Auth Database connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Auth Database connection disconnected.');
    });

    await mongoose.connect(config.mongoUri);
  } catch (error) {
    logger.error('Failed to connect to MongoDB cluster:', error);
    process.exit(1);
  }
};
