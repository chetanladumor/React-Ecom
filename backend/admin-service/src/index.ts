/**
 * @file backend/admin-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Admin Service, registering Express controllers and safety middlewares.
 * 
 * @why-pattern-selected
 * Sequential startup process. Binds middlewares and starts Express port listener.
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
import { config } from './config/admin.config';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes mounting
app.use('/', adminRoutes);

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'admin-service',
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

  logger.error(`Critical Admin Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: config.env === 'production' ? 'Internal server configuration error' : err.message,
  });
});

const bootstrap = async () => {
  // Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Admin Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Admin Service...');
    server.close(() => {
      logger.info('Admin Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
