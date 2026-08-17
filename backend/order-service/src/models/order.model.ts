/**
 * @file backend/order-service/src/models/order.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Customer Orders in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Defines order items as nested array subdocuments, 
 * capturing historical prices at the exact time of order placement (Snapshot pattern).
 * 
 * @alternative-approaches
 * - Storing product references instead of frozen prices: Anti-pattern. If a product's price updates 
 *   later, historical order totals would change retrospectively.
 * 
 * @performance-impact
 * Indexes `userId` to speed up order history queries and `correlationId` to track distributed Saga lookups.
 * 
 * @scaling-considerations
 * Sharding on `{ userId: 1 }` groups user order histories on single nodes, optimize read queries.
 */

import { Schema, model, Document } from 'mongoose';

export interface IOrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: number;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  correlationId: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrder>('Order', orderSchema);
