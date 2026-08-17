/**
 * @file backend/order-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Order Service. Connects to MongoDB, RabbitMQ broker, 
 * starts Outbox Sweepers, binds consumers, and opens Express port listeners.
 * 
 * @why-pattern-selected
 * Sequential startup process. Guarantees that message brokers, database connection pools, 
 * and sweeper schedulers are ready before opening the port listener.
 * 
 * @alternative-approaches
 * - Launching HTTP listener asynchronously in parallel with DB/Cache initialization: 
 *   Can lead to connection drop errors on startup queries.
 * 
 * @performance-impact
 * Port listener is initialized inside an asynchronous loop. Very fast.
 * 
 * @scaling-considerations
 * Setting up active connections pooling for databases and messaging allows handling multiple 
 * concurrent request instances cleanly.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/order.config';
import { connectDatabase } from './config/db';
import { connectRabbitMQ, closeRabbitMQ } from './events/publisher';
import { startListening } from './events/consumer';
import { startOutboxProcessor, stopOutboxProcessor } from './services/outbox.processor';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import orderRoutes from './routes/order.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes mounting
app.use('/', orderRoutes);

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

  logger.error(`Critical Order Failure: ${err.message}`, { stack: err.stack });
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

  // 3. Start consuming RabbitMQ events
  await startListening();

  // 4. Start Outbox table sweeper scheduler
  startOutboxProcessor();

  // 5. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Order Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Order Service...');
    server.close(async () => {
      stopOutboxProcessor();
      await closeRabbitMQ();
      logger.info('Order Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
