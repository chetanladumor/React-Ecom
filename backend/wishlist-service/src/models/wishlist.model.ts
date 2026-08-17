/**
 * @file backend/wishlist-service/src/models/wishlist.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for User Wishlist documents in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Represents wishlisted products as an array of product IDs 
 * directly inside the user's wishlist document, optimizing reads and writes.
 * 
 * @alternative-approaches
 * - Flat relational model: Having a `WishlistItem` collection with `wishlistId` and `productId`. 
 *   Requires database joins or aggregation lookups.
 * 
 * @performance-impact
 * Defines a unique index on `userId` to speed up wishlist fetching.
 * 
 * @scaling-considerations
 * Sharding on `{ userId: 1 }` ensures that a customer's wishlist mutations are entirely local 
 * to a single database shard.
 */

import { Schema, model, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: number;
  products: number[]; // Array of product IDs
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        type: Number,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);
