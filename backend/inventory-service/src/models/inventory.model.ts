/**
 * @file backend/inventory-service/src/models/inventory.model.ts
 * 
 * @why-file-exists
 * Represents the persistent schema definition and interfaces for Inventory documents in MongoDB.
 * 
 * @why-pattern-selected
 * Document Object Mapper pattern via Mongoose. Defines structural validation rules.
 * 
 * @alternative-approaches
 * - Schemaless raw driver queries: Fragile. Increases the risk of database schema drift.
 * 
 * @performance-impact
 * Defines a unique index on `productId` to speed up stock status lookups and locks.
 * 
 * @scaling-considerations
 * Since inventory checks are highly dynamic and write-heavy, sharding on `{ productId: 1 }` 
 * ensures balanced data distribution and fast lookup routing.
 */

import { Schema, model, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: number;
  stock: number;
  reserved: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    productId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    reserved: {
      type: Number,
      required: true,
      min: [0, 'Reserved stock cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Inventory = model<IInventory>('Inventory', inventorySchema);
