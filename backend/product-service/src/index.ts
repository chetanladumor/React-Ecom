/**
 * @file backend/product-service/src/index.ts
 * 
 * @why-file-exists
 * Bootstraps the Product Service. Connects to MongoDB, Redis Cache-Aside client, 
 * registers Express controllers, and handles database seeding on clean starts.
 * 
 * @why-pattern-selected
 * Sequential startup process. Guarantees that Redis caching layers and Mongo connection instances 
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
 * Setting up active connections pooling for databases and cache allows handling multiple 
 * concurrent request instances cleanly.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/product.config';
import { connectDatabase } from './config/db';
import { connectRedis, redisClient } from './config/redis';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import productRoutes from './routes/product.routes';
import { Product } from './models/product.model';
import { startListening, closeRabbitMQ } from './events/consumer';

const app = express();
// ... [remainder of middlewares and routes] ...


app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
  });
});

// Catalog routes mapping
app.use('/', productRoutes);

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

  logger.error(`Critical Catalog Failure: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: config.env === 'production' ? 'Internal server configuration error' : err.message,
  });
});

/**
 * Seeding helper to populate MongoDB with raw products from Fake Store API structure
 * if the database collection is currently empty on start.
 */
const seedProductsIfEmpty = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      logger.info('Product Database is empty. Seeding initial products list...');
      
      const response = await fetch('https://fakestoreapi.com/products');
      if (!response.ok) throw new Error('Failed to retrieve seed products from external API');
      
      const seedData = await response.json() as any[];
      const mappedProducts = seedData.map((item) => ({
        _id: item.id,
        title: item.title,
        price: item.price,
        description: item.description,
        category: item.category,
        image: item.image,
        rating: {
          rate: item.rating?.rate || 0,
          count: item.rating?.count || 0,
        },
      }));

      await Product.insertMany(mappedProducts);
      logger.info(`Successfully seeded ${mappedProducts.length} catalog items into MongoDB.`);
    }
  } catch (error) {
    logger.error('Error during catalog seeding:', error);
  }
};

const bootstrap = async () => {
  // 1. Establish database connection pool
  await connectDatabase();

  // 2. Connect to Redis Cache-Aside client
  await connectRedis();

  // 3. Seed product catalog if empty
  await seedProductsIfEmpty();

  // 4. Start consuming RabbitMQ events
  await startListening();

  // 5. Start HTTP PORT listener
  const server = app.listen(config.port, () => {
    logger.info(`Product Service active in [${config.env}] on port ${config.port}`);
  });

  // Graceful shutdowns
  const shutdown = async () => {
    logger.info('Received shutdown signal. Stopping Product Service...');
    server.close(async () => {
      try {
        await redisClient.disconnect();
        await closeRabbitMQ();
      } catch (e) {}
      logger.info('Product Service shut down successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap();
