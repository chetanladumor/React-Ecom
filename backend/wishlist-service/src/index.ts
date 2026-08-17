/**
 * @file backend/wishlist-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Wishlist Service. Connects to MongoDB, registers Express controllers, 
 * and binds global safety middlewares.
 * 
 * @why-pattern-selected
 * Sequential startup process. Guarantees that MongoDB connection pools are established 
 * before opening the HTTP port listener.
 * 
 * @alternative-approaches
 * - Launching HTTP listener asynchronously in parallel with DB initialization: 
 *   Can lead to connection drop errors on startup queries.
 * 
 * @performance-impact
 * Port listener is initialized inside an asynchronous loop. Very fast.
 * 
 * @scaling-considerations
 * Setting up active connections pooling for databases allows handling multiple 
 * concurrent request instances cleanly.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/wishlist.config';
import { connectDatabase } from './config/db';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import wishlistRoutes from './routes/wishlist.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes mounting
app.use('/', wishlistRoutes);

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'wishlist-service',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`Operational Warning: ${err.message}`, { statusCode: err.statusCode });
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  logger.error(`Critical Wishlist Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: config.env === 'production' ? 'Internal server configuration error' : err.message,
  });
});

const bootstrap = async () => {
  // 1. Establish database connection pool
  await connectDatabase();

  // 2. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Wishlist Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Wishlist Service...');
    server.close(() => {
      logger.info('Wishlist Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
