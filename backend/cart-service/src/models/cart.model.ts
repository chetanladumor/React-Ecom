/**
 * @file backend/cart-service/src/models/cart.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Shopping Cart documents in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Represents cart items as nested subdocuments 
 * in a single user cart document, minimizing multi-collection joins.
 * 
 * @alternative-approaches
 * - Flat relational model: Having a `CartItem` collection with `cartId` references. 
 *   Requires collection joins or multiple queries to retrieve a single user's cart, slowing performance.
 * 
 * @performance-impact
 * Defines a unique index on `userId` to speed up cart fetching.
 * 
 * @scaling-considerations
 * Since carts are retrieved and updated on almost every page visit, using sharding on `{ userId: 1 }` 
 * places a user's entire cart data on a single shard, maximizing read/write performance.
 */

import { Schema, model, Document } from 'mongoose';

export interface ICartItem {
  productId: number;
  quantity: number;
}

export interface ICart extends Document {
  userId: number;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: false } // Disable _id for subdocuments to reduce size
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

export const Cart = model<ICart>('Cart', cartSchema);
