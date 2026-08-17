/**
 * @file backend/notification-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Notification Service, registers event consumer listeners, 
 * and exposes Express health endpoints.
 * 
 * @why-pattern-selected
 * Sequential startup process. Guarantees that message brokers are ready before opening the HTTP port listener.
 * 
 * @alternative-approaches
 * - Launching HTTP listener asynchronously in parallel with AMQP initialization: 
 *   Can lead to connection drop errors on startup queries.
 * 
 * @performance-impact
 * Port listener is initialized inside an asynchronous loop. Very fast.
 * 
 * @scaling-considerations
 * Setting up active connections pooling for messaging allows handling multiple 
 * concurrent request instances cleanly.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/notification.config';
import { startListening, closeRabbitMQ } from './events/consumer';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Critical Notification Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: 'Internal notification config error',
  });
});

const bootstrap = async () => {
  // 1. Connect to RabbitMQ and start consuming events
  await startListening();

  // 2. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Notification Service active on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Notification Service...');
    server.close(async () => {
      await closeRabbitMQ();
      logger.info('Notification Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
