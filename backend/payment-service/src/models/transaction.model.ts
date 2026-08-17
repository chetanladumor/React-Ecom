/**
 * @file backend/payment-service/src/models/transaction.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Payment Transactions in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Defines transaction parameters for record keeping.
 * 
 * @alternative-approaches
 * - Schemaless raw driver queries: Fragile. Increases the risk of writing malformed transaction history entries.
 * 
 * @performance-impact
 * Indexes `orderId` to support quick payment status lookups and `transactionId` to ensure 
 * external payment processor webhook idempotency.
 * 
 * @scaling-considerations
 * Since transaction records are critical for compliance, sharding on `{ createdAt: 1 }` or `{ userId: 1 }` 
 * ensures balanced data distribution.
 */

import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  orderId: string;
  userId: number;
  amount: number;
  status: 'success' | 'failed';
  transactionId: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
