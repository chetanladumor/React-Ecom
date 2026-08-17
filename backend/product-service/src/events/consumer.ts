/**
 * @file backend/product-service/src/events/consumer.ts
 * 
 * @why-file-exists
 * Subscribes to catalog update events (such as reviews recalculations) to update local ratings 
 * and actively invalidate Redis cache keys.
 * 
 * @why-pattern-selected
 * Event-Driven Consumer pattern. Connects to RabbitMQ to keep product details synchronized 
 * across boundaries without direct sync HTTP coupling.
 * 
 * @alternative-approaches
 * - Direct HTTP webhook triggers: Highly coupled, blocks the Review Service operations if Product Service 
 *   is busy or restarting.
 * 
 * @performance-impact
 * Runs asynchronously out-of-band. Employs active Redis invalidation (`redisClient.del`), ensuring 
 * subsequent details lookups get the fresh DB state.
 * 
 * @scaling-considerations
 * Employs competing consumers. Multiple instances of the Product Service can listen to the same queue 
 * (`product.review-updates`), and RabbitMQ will distribute messages round-robin to scale throughput.
 */

import { connect } from 'amqplib';
import { config } from '../config/product.config';
import { Product } from '../models/product.model';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;

const EXCHANGE_NAME = 'eshop.events';
const QUEUE_NAME = 'product.review-updates';

export const startListening = async (): Promise<void> => {
  try {
    // 1. Establish connection and channel
    connection = await connect(config.rabbitmqUrl);
    channel = await connection.createChannel();

    // 2. Assert exchange and queue
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // 3. Bind queue to review.updated events
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'review.updated');

    // 4. Consume messages
    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const correlationId = content.data?.correlationId || 'unknown';

      logger.info(`Received event in Product Service: '${routingKey}'`, { correlationId });

      try {
        if (routingKey === 'review.updated') {
          const { productId, rate, count } = content.data;

          logger.info(`Updating rating metrics for product ${productId}: Rate=${rate}, Count=${count}`, { correlationId });

          // Update MongoDB product record
          await Product.findByIdAndUpdate(productId, {
            'rating.rate': rate,
            'rating.count': count,
          });

          // Invalidate cache in Redis to keep catalog listings fresh
          const cacheKey = `product:${productId}`;
          await redisClient.del(cacheKey);

          logger.info(`Successfully synchronized ratings and invalidated Redis cache for product ${productId}`, { correlationId });
        }

        // Acknowledge message processing successful
        channel.ack(msg);
      } catch (err: any) {
        logger.error(`Error processing consumed event '${routingKey}': ${err.message}`, { correlationId });
        // Reject and requeue
        channel.nack(msg, false, true);
      }
    });

    logger.info('Product Service successfully connected to RabbitMQ and listening.');
  } catch (error) {
    logger.error('Failed to set up product event consumer queue subscriptions:', error);
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed gracefully in Product Service.');
  } catch (error) {
    logger.error('Error during RabbitMQ shutdown in Product Service:', error);
  }
};
