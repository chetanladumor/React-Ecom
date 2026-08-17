/**
 * @file backend/notification-service/src/events/consumer.ts
 * 
 * @why-file-exists
 * Subscribes to user registration and order completion events to dispatch customer alerts.
 * 
 * @why-pattern-selected
 * Event-Driven Consumer pattern. Decouples notification channels from auth or checkout flows.
 * 
 * @alternative-approaches
 * - Direct HTTP triggers during checkout: Slower, takes up valuable process time, and 
 *   blocks response streams if the notification gateway (like SendGrid/Twilio) is slow.
 * 
 * @performance-impact
 * Operates entirely out-of-band/asynchronously. Zero impact on customer request flows.
 * 
 * @scaling-considerations
 * Employs competing consumers. Multiple instances of the Notification Service can listen to the same queue 
 * (`notification.alerts-queue`), and RabbitMQ will distribute messages round-robin to scale throughput.
 */

import { connect } from 'amqplib';
import { config } from '../config/notification.config';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;

const EXCHANGE_NAME = 'eshop.events';
const QUEUE_NAME = 'notification.alerts-queue';

export const startListening = async (): Promise<void> => {
  try {
    // 1. Establish connection and channel
    connection = await connect(config.rabbitmqUrl);
    channel = await connection.createChannel();

    // 2. Assert exchange and queue
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // 3. Bind queue to relevant routing keys
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'user.registered');
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'order.completed');
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'order.cancelled');

    // 4. Consume messages
    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const correlationId = content.data?.correlationId || 'unknown';

      logger.info(`Received notification event: '${routingKey}'`, { correlationId });

      try {
        if (routingKey === 'user.registered') {
          const { userId, email, name } = content.data;
          logger.info(`[SIMULATION] Sending WELCOME email to ${name} (${email}). Welcome to the E-Commerce App!`, { correlationId, userId });
        } 
        else if (routingKey === 'order.completed') {
          const { orderId, userId, totalAmount } = content.data;
          logger.info(`[SIMULATION] Sending ORDER CONFIRMATION email to User ${userId} for order ${orderId} (Charged: $${totalAmount})`, { correlationId });
        } 
        else if (routingKey === 'order.cancelled') {
          const { orderId, userId, reason } = content.data;
          logger.info(`[SIMULATION] Sending ORDER CANCELLATION email to User ${userId} for order ${orderId}. Reason: ${reason}`, { correlationId });
        }

        // Acknowledge message processing successful
        channel.ack(msg);
      } catch (err: any) {
        logger.error(`Error processing consumed notification event '${routingKey}': ${err.message}`, { correlationId });
        // Reject and requeue
        channel.nack(msg, false, true);
      }
    });

    logger.info('Notification Service successfully connected to RabbitMQ and listening.');
  } catch (error) {
    logger.error('Failed to set up notification event consumer queue subscriptions:', error);
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
