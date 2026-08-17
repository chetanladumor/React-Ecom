/**
 * @file backend/auth-service/src/events/publisher.ts
 * 
 * @why-file-exists
 * Establishes an AMQP channel connection to RabbitMQ, enabling the Auth Service to broadcast 
 * identity mutations (such as user registrations) to other microservices.
 * 
 * @why-pattern-selected
 * Publish/Subscribe pattern. Decouples the Auth Service from other domains by emitting events 
 * rather than calling HTTP endpoints synchronously.
 * 
 * @alternative-approaches
 * - Direct HTTP calls: Anti-pattern. If a downstream service (like Cart or Notification) is down or slow, 
 *   user registration fails or hangs.
 * - Shared Database: Anti-pattern. Breaks microservice isolation and databases-per-service principles.
 * 
 * @performance-impact
 * Connection and channels are established once at startup. Messages are published asynchronously 
 * over the existing socket in non-blocking event-driven fashion.
 * 
 * @scaling-considerations
 * Employs a durable, fanout or topic exchange ('eshop.events') so multiple queues can consume 
 * registration events independently without modifying the Auth publisher codebase.
 */

import { connect } from 'amqplib';
import { config } from '../config/auth.config';
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
    
    // Declare topic exchange for routing key flexibility
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    logger.info('Auth Service successfully connected to RabbitMQ Broker.');
  } catch (error) {
    logger.error('Failed to establish connection to RabbitMQ:', error);
    // In production, you would implement reconnect retries. For local development, we fail fast.
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
      persistent: true, // Persist messages to disk to survive RabbitMQ crashes
    });

    if (result) {
      logger.info(`Event published: '${routingKey}'`);
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
