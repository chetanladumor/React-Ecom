/**
 * @file backend/order-service/src/events/consumer.ts
 * 
 * @why-file-exists
 * Subscribes to Saga event responses (inventory locks and payment statuses), updating 
 * the order state accordingly.
 * 
 * @why-pattern-selected
 * Choreographed Saga Pattern step. Binds handlers to routing outcomes to complete or roll back 
 * order checkouts asynchronously.
 * 
 * @alternative-approaches
 * - Orchestrator-based Saga: Central orchestrator runs state loops. Choreography is simpler and 
 *   removes the single orchestrator performance bottleneck.
 * 
 * @performance-impact
 * Works on push-based message subscription. Executes handlers only when events are dispatched.
 * 
 * @scaling-considerations
 * Employs competing consumers. Multiple instances of the Order Service can listen to the same queue 
 * (`order.saga-events`), and RabbitMQ will distribute messages round-robin to scale throughput.
 */

import { channel } from './publisher';
import { OrderService } from '../services/order.service';
import { logger } from '../utils/logger';

const QUEUE_NAME = 'order.saga-events';

export const startListening = async (): Promise<void> => {
  if (!channel) {
    logger.warn('Cannot start consuming events: RabbitMQ channel is not established.');
    return;
  }

  try {
    // Assert queue for order-service events
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue to Saga step events
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'inventory.failed');
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'payment.completed');
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'payment.failed');

    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const correlationId = content.data.correlationId || 'unknown';

      logger.info(`Received Saga outcome event in Order Service: '${routingKey}'`, { correlationId });

      try {
        const { orderId } = content.data;

        if (routingKey === 'inventory.failed') {
          const { reason } = content.data;
          await OrderService.cancelOrder(orderId, `Inventory lock failed: ${reason}`, correlationId);
          logger.info(`Saga Compensated: Cancelled order ${orderId} due to stock shortage`, { correlationId });
        } 
        else if (routingKey === 'payment.completed') {
          await OrderService.completeOrder(orderId, correlationId);
          logger.info(`Saga Success: Order ${orderId} marked as completed`, { correlationId });
        } 
        else if (routingKey === 'payment.failed') {
          const { reason } = content.data;
          await OrderService.cancelOrder(orderId, `Payment failed: ${reason}`, correlationId);
          logger.info(`Saga Compensated: Cancelled order ${orderId} due to payment decline`, { correlationId });
        }

        // Acknowledge message processing successful
        channel.ack(msg);
      } catch (err: any) {
        logger.error(`Error processing consumed Saga event '${routingKey}': ${err.message}`, { correlationId });
        // Requeue the message for retry if it is a transient error, otherwise reject
        channel.nack(msg, false, true);
      }
    });

    logger.info('Order event consumer active and listening.');
  } catch (error) {
    logger.error('Failed to set up order event consumer queue subscriptions:', error);
  }
};
