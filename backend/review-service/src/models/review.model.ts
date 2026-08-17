/**
 * @file backend/review-service/src/models/review.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Customer Reviews in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Defines rating bounds (1-5) and validations.
 * 
 * @alternative-approaches
 * - Schemaless raw driver queries: Fragile. Increases the risk of database schema drift.
 * 
 * @performance-impact
 * Defines a compound unique index on `{ productId: 1, userId: 1 }` to enforce a one-review-per-product business rule 
 * while speeding up product-specific review listings queries.
 * 
 * @scaling-considerations
 * Sharding on `{ productId: 1 }` locates all reviews for a product on the same shard node, 
 * optimizing the list aggregations.
 */

import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  productId: number;
  userId: number;
  userName: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Number,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
