/**
 * @file backend/product-service/src/models/product.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Product documents in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Declares structural models, validations, 
 * and indices in a centralized place.
 * 
 * @alternative-approaches
 * - Schemaless raw driver queries: Fragile. Increases the risk of writing malformed product records.
 * 
 * @performance-impact
 * Defines text indexes on `title` and `description` to enable basic search capabilities. 
 * Defines compound indexes on `{ category: 1, price: 1 }` to optimize category filtering and price sorting.
 * 
 * @scaling-considerations
 * For huge catalogs, offload text searches to a dedicated indexer (Elasticsearch/Algolia) 
 * since text search indexes in MongoDB can take up significant RAM.
 */

import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: number; // Set as Number to match the Fake Store API product ID mapping
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    _id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true, // Index for category filtering
    },
    image: {
      type: String,
      required: true,
    },
    rating: {
      rate: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    _id: false, // Override default ObjectId creation since we supply explicit numeric IDs
  }
);

// 1. Text Index for title and description search
productSchema.index(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 2 }, name: 'ProductTextIndex' }
);

// 2. Compound Index for category filtering and price sorting
productSchema.index({ category: 1, price: 1 });

export const Product = model<IProduct>('Product', productSchema);
