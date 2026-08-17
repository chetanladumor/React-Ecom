/**
 * @file backend/review-service/src/events/publisher.ts
 * 
 * @why-file-exists
 * Establishes channels and connection pools to publish Review events to RabbitMQ.
 * 
 * @why-pattern-selected
 * Publish/Subscribe pattern. Decouples reviews updates from downstream listeners (like Product catalog).
 * 
 * @alternative-approaches
 * - Direct HTTP calls: Anti-pattern. If a downstream service is down, events are lost.
 * 
 * @performance-impact
 * Connection and channels are established once at startup. Messages are published asynchronously.
 * 
 * @scaling-considerations
 * Employs a durable topic exchange ('eshop.events') to route messages correctly.
 */

import { connect } from 'amqplib';
import { config } from '../config/review.config';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;

const EXCHANGE_NAME = 'eshop.events';

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await connect(config.rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    logger.info('Review Service successfully connected to RabbitMQ Broker.');
  } catch (error) {
    logger.error('Failed to establish connection to RabbitMQ:', error);
  }
};

/**
 * Publishes an event to the topic exchange with a specific routing key.
 */
export const publishEvent = async (routingKey: string, payload: Record<string, unknown>): Promise<boolean> => {
  if (!channel) {
    logger.warn(`Could not publish event: RabbitMQ channel not established. RoutingKey: ${routingKey}`);
    return false;
  }

  try {
    const messageBuffer = Buffer.from(JSON.stringify({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      data: payload,
    }));

    const result = channel.publish(EXCHANGE_NAME, routingKey, messageBuffer, {
      persistent: true,
    });

    if (result) {
      logger.info(`Event published from Review Service: '${routingKey}'`);
    }

    return result;
  } catch (error) {
    logger.error(`Error publishing event to queue: ${routingKey}`, error);
    return false;
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed gracefully.');
  } catch (error) {
    logger.error('Error during RabbitMQ shutdown:', error);
  }
};

export { connection, channel };
