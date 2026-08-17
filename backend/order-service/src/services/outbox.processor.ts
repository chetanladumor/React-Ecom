/**
 * @file backend/order-service/src/services/outbox.processor.ts
 * 
 * @why-file-exists
 * Periodically polls the Outbox database collection to publish unsent events to RabbitMQ.
 * 
 * @why-pattern-selected
 * Polling Publisher variant of the Outbox pattern. Guarantees message delivery using a simple 
 * database loop.
 * 
 * @alternative-approaches
 * - Transaction Log Tailing (Debezium / CDC): Highly performant and real-time, but adds significant 
 *   operational complexity and external infrastructure dependencies. Polling works cleanly for most scales.
 * 
 * @performance-impact
 * Uses batch queries (`limit(10)`) and processes events sequentially to prevent high memory or CPU usage.
 * 
 * @scaling-considerations
 * If running multiple instances of the Order service, use optimistic locking or a distributed job scheduler 
 * (like BullMQ) to prevent multiple sweepers from duplicate publishing.
 */

import { Outbox } from '../models/outbox.model';
import { publishEvent } from '../events/publisher';
import { logger } from '../utils/logger';
import { config } from '../config/order.config';

let intervalId: NodeJS.Timeout | null = null;

export const startOutboxProcessor = (): void => {
  logger.info('Starting Transactional Outbox Sweeper...');
  
  intervalId = setInterval(async () => {
    try {
      // Find unprocessed outbox events sorted chronologically
      const pendingEvents = await Outbox.find({ processed: false })
        .sort({ createdAt: 1 })
        .limit(10)
        .exec();

      for (const event of pendingEvents) {
        event.attempts += 1;
        
        // Publish payload to the exchange using eventType as routing key
        const success = await publishEvent(event.eventType, event.payload);
        
        if (success) {
          event.processed = true;
        } else {
          event.error = 'Connection to RabbitMQ broker lost';
        }
        
        await event.save();
      }
    } catch (error: any) {
      logger.error('Error sweeping Transactional Outbox table:', error);
    }
  }, config.outboxPollIntervalMs);
};

export const stopOutboxProcessor = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Transactional Outbox Sweeper stopped.');
  }
};
