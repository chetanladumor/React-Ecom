/**
 * @file backend/order-service/src/models/outbox.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Transactional Outbox 
 * events waiting to be published to RabbitMQ.
 * 
 * @why-pattern-selected
 * Transactional Outbox Pattern. Rather than sending messages directly to RabbitMQ during 
 * request processing (which risk losing events if the broker crashes), we save the message 
 * payload inside our local MongoDB database as part of the order transaction.
 * 
 * @alternative-approaches
 * - Direct publishing inside controller handlers: Anti-pattern. Leads to lost events 
 *   or phantom events on database transaction rollbacks.
 * 
 * @performance-impact
 * Defines compound index on `{ processed: 1, createdAt: 1 }` to support low-latency sweeps 
 * by the background processor.
 * 
 * @scaling-considerations
 * Enables guaranteed "at-least-once" delivery semantics in event-driven systems.
 */

import { Schema, model, Document } from 'mongoose';

export interface IOutbox extends Document {
  eventType: string;
  payload: Record<string, any>;
  processed: boolean;
  attempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const outboxSchema = new Schema<IOutbox>(
  {
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processed: {
      type: Boolean,
      required: true,
      default: false,
      index: true, // Sweeper queries target processed: false
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help the polling sweeper retrieve unprocessed events fast
outboxSchema.index({ processed: 1, createdAt: 1 });

export const Outbox = model<IOutbox>('Outbox', outboxSchema);
