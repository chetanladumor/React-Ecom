/**
 * @file backend/inventory-service/src/events/consumer.ts
 * 
 * @why-file-exists
 * Subscribes to order-related events in RabbitMQ, enabling the Inventory Service to react 
 * and manage stock locks/releases asynchronously.
 * 
 * @why-pattern-selected
 * Event-Driven Consumer pattern. Listens to specific routing keys (`order.created`, `order.cancelled`, 
 * `order.completed`) to participate in the checkout Saga flow without tight HTTP coupling.
 * 
 * @alternative-approaches
 * - Polling the Order database: Extremely slow and wastes substantial database connection I/O.
 * 
 * @performance-impact
 * Works on push-based message subscription. Executes handlers only when events are dispatched.
 * 
 * @scaling-considerations
 * Employs competing consumers. Multiple instances of the Inventory Service can listen to the same queue 
 * (`inventory.order-events`), and RabbitMQ will distribute messages round-robin to scale throughput.
 */

import { channel } from './publisher';
import { InventoryService } from '../services/inventory.service';
import { publishEvent } from './publisher';
import { logger } from '../utils/logger';

const QUEUE_NAME = 'inventory.order-events';

export const startListening = async (): Promise<void> => {
  if (!channel) {
    logger.warn('Cannot start consuming events: RabbitMQ channel is not established.');
    return;
  }

  try {
    // Assert queue for inventory-service events
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue to specific routing patterns in our events exchange
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'order.created');
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'order.cancelled');
    await channel.bindQueue(QUEUE_NAME, 'eshop.events', 'order.completed');

    channel.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const correlationId = content.data.correlationId || 'unknown';

      logger.info(`Received event in Inventory Service: '${routingKey}'`, { correlationId });

      try {
        if (routingKey === 'order.created') {
          const { orderId, userId, items, totalAmount } = content.data;

          try {
            // Attempt to atomically lock stock for this order
            await InventoryService.lockStock(items);
            
            // Stock successfully reserved! Publish event back to exchange
            await publishEvent('inventory.reserved', {
              orderId,
              userId,
              totalAmount,
              items,
              correlationId,
            });
            logger.info(`Successfully locked stock for order ${orderId}`, { correlationId });
          } catch (error: any) {
            logger.warn(`Failed to lock stock for order ${orderId}: ${error.message}`, { correlationId });
            
            // Publish reservation failure event
            await publishEvent('inventory.failed', {
              orderId,
              reason: error.message,
              correlationId,
            });
          }
        } 
        else if (routingKey === 'order.cancelled') {
          const { items } = content.data;
          await InventoryService.unlockStock(items);
          logger.info(`Successfully unlocked/restored stock for cancelled order`, { correlationId });
        } 
        else if (routingKey === 'order.completed') {
          const { items } = content.data;
          await InventoryService.commitStock(items);
          logger.info(`Successfully committed stock for completed order`, { correlationId });
        }

        // Acknowledge message processing successful
        channel.ack(msg);
      } catch (err: any) {
        logger.error(`Error processing consumed event '${routingKey}': ${err.message}`, { correlationId });
        // Requeue the message for retry if it is a transient error, otherwise reject
        channel.nack(msg, false, true);
      }
    });

    logger.info('Inventory event consumer active and listening.');
  } catch (error) {
    logger.error('Failed to set up inventory event consumer queue subscriptions:', error);
  }
};
