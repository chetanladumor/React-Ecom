/**
 * @file backend/payment-service/src/events/consumer.ts
 * 
 * @why-file-exists
 * Subscribes to inventory lock confirmation events to process matching customer payments.
 * 
 * @why-pattern-selected
 * Choreographed Saga Pattern step. Binds handlers to billing actions and coordinates outcomes 
 * via event notifications.
 * 
 * @alternative-approaches
 * - Orchestrator-based Saga: Central orchestrator runs state loops. Choreography is simpler and 
 *   removes the single orchestrator performance bottleneck.
 * 
 * @performance-impact
 * Works on push-based message subscription. Executes handlers only when events are dispatched.
 * 
 * @scaling-considerations
 * Employs competing consumers. Multiple instances of the Payment Service can listen to the same queue 
 * (`payment.inventory-events`), and RabbitMQ will distribute messages round-robin to scale throughput.
 */

import { channel } from './publisher';
import { PaymentService } from '../services/payment.service';
import { publishEvent } from './publisher';
import { logger } from '../utils/logger';

const QUEUE_NAME = 'payment.inventory-events';

export const startListening = async (): Promise<void> => {
  if (!channel) {
    logger.warn('Cannot start consuming events: RabbitMQ channel is not established.');
    return;
  }

  try {
    // Assert queue for payment-service events
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue to inventory.reserved events
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'inventory.reserved');

    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const correlationId = content.data.correlationId || 'unknown';

      logger.info(`Received event in Payment Service: '${routingKey}'`, { correlationId });

      try {
        if (routingKey === 'inventory.reserved') {
          const { orderId, userId, totalAmount } = content.data;

          try {
            logger.info(`Attempting billing charge of $${totalAmount} for order ${orderId}`, { correlationId });
            
            // Trigger mock credit card processing
            await PaymentService.processPayment(orderId, userId, totalAmount);
            
            // Payment success! Publish event back to exchange
            await publishEvent('payment.completed', {
              orderId,
              userId,
              amount: totalAmount,
              correlationId,
            });
            logger.info(`Successfully processed payment for order ${orderId}`, { correlationId });
          } catch (error: any) {
            logger.warn(`Payment transaction declined for order ${orderId}: ${error.message}`, { correlationId });
            
            // Publish payment failure event (triggers stock unlock compensation)
            await publishEvent('payment.failed', {
              orderId,
              userId,
              reason: error.message,
              correlationId,
            });
          }
        }

        // Acknowledge message processing successful
        channel.ack(msg);
      } catch (err: any) {
        logger.error(`Error processing consumed event '${routingKey}': ${err.message}`, { correlationId });
        // Requeue the message for retry if it is a transient error, otherwise reject
        channel.nack(msg, false, true);
      }
    });

    logger.info('Payment event consumer active and listening.');
  } catch (error) {
    logger.error('Failed to set up payment event consumer queue subscriptions:', error);
  }
};
