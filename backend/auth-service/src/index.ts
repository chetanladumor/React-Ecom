/**
 * @file backend/auth-service/src/index.ts
 * 
 * @why-file-exists
 * Serves as the bootstrap script for the Auth Service. Hooks up MongoDB connections, 
 * RabbitMQ publishers, binds security middlewares, and starts the Express server.
 * 
 * @why-pattern-selected
 * Orchestrated bootstrap process. Sequences infrastructure connections before opening port listeners 
 * to guarantee that no requests are accepted before the database or message broker is ready.
 * 
 * @alternative-approaches
 * - Launching the HTTP port before database connections complete: Risky. Can result in 500 errors 
 *   if requests hit the endpoint while MongoDB is still connecting.
 * 
 * @performance-impact
 * Port listener is started inside an asynchronous socket loop. Very fast.
 * 
 * @scaling-considerations
 * Graceful shutdowns ensure that active HTTP client streams are processed and database 
 * connection pools are released clean on container scaling events (SIGTERM).
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/auth.config';
import { connectDatabase } from './config/db';
import { connectRabbitMQ, closeRabbitMQ } from './events/publisher';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Identity routes mounting
app.use('/', authRoutes);

// Healthcheck endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error boundary middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`Operational Warning: ${err.message}`, { statusCode: err.statusCode });
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  logger.error(`Critical Auth Service Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: config.env === 'production' ? 'Internal server configuration error' : err.message,
  });
});

const bootstrap = async () => {
  // 1. Establish database connection pool
  await connectDatabase();

  // 2. Connect to RabbitMQ message broker
  await connectRabbitMQ();

  // 3. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Auth Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Auth Service...');
    server.close(async () => {
      await closeRabbitMQ();
      logger.info('Auth Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
