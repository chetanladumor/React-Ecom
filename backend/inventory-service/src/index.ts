/**
 * @file backend/inventory-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Inventory Service. Connects to MongoDB, RabbitMQ broker, 
 * binds consumer listeners, and handles initial test inventories seeding.
 * 
 * @why-pattern-selected
 * Sequential startup process. Guarantees message channels are listening and database connections 
 * are ready before opening the port listener.
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
import { config } from './config/inventory.config';
import { connectDatabase } from './config/db';
import { connectRabbitMQ, closeRabbitMQ } from './events/publisher';
import { startListening } from './events/consumer';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import inventoryRoutes from './routes/inventory.routes';
import { InventoryService } from './services/inventory.service';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes mapping
app.use('/', inventoryRoutes);

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

  logger.error(`Critical Inventory Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: config.env === 'production' ? 'Internal server configuration error' : err.message,
  });
});

/**
 * Seeding helper to initialize starting stock (100 units) for mock products 1-50.
 */
const seedMockInventories = async () => {
  try {
    const mockStockItems = [];
    for (let i = 1; i <= 50; i++) {
      mockStockItems.push({ productId: i, stock: 100 });
    }
    await InventoryService.seedStock(mockStockItems);
    logger.info('Successfully seeded mock inventory stock for products 1-50.');
  } catch (error) {
    logger.error('Failed to seed mock inventories on boot:', error);
  }
};

const bootstrap = async () => {
  // 1. Establish database connection pool
  await connectDatabase();

  // 2. Connect to RabbitMQ message broker
  await connectRabbitMQ();

  // 3. Start consuming RabbitMQ events
  await startListening();

  // 4. Seed stock levels for local testing
  await seedMockInventories();

  // 5. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Inventory Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Inventory Service...');
    server.close(async () => {
      await closeRabbitMQ();
      logger.info('Inventory Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
