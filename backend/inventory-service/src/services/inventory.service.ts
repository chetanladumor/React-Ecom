/**
 * @file backend/inventory-service/src/services/inventory.service.ts
 * 
 * @why-file-exists
 * Encapsulates core business logic for stock levels management, item reservations, and 
 * atomic stock locks during checkouts.
 * 
 * @why-pattern-selected
 * Atomic Update / Compensating Transaction rollback pattern. To prevent race conditions where 
 * two customers checkout the last remaining item, we use MongoDB's atomic query filters. 
 * If a multi-item lock fails midway, we run compensating updates to release previously locked stock.
 * 
 * @alternative-approaches
 * - Distributed Locks (Redis Redlock): Very secure, but introduces high network roundtrip latency 
 *   and lock contention overhead.
 * - MongoDB Multi-Document Transactions: Standard, but requires MongoDB Replica Set configuration 
 *   which may not be active in single-node dev environments. Atomic updates work out-of-the-box.
 * 
 * @performance-impact
 * Uses atomic MongoDB updates (`findOneAndUpdate` with `$inc`) which runs in O(1) index lookup time, 
 * completely avoiding database locking bottle-necks.
 * 
 * @scaling-considerations
 * By making lock allocations stateless and local to the document, we can distribute 
 * MongoDB collections across multiple database shards without compromising correctness.
 */

import { Inventory, IInventory } from '../models/inventory.model';
import { NotFoundError, InsufficientStockError } from '../utils/errors';

export interface InventoryItem {
  productId: number;
  quantity: number;
}

export class InventoryService {
  /**
   * Retrieves stock status for a given product.
   */
  public static async getStockByProduct(productId: number): Promise<IInventory> {
    let inventory = await Inventory.findOne({ productId });
    if (!inventory) {
      // If no inventory record exists, create a default record with 50 stock units (automatic initialization)
      inventory = new Inventory({
        productId,
        stock: 50,
        reserved: 0,
      });
      await inventory.save();
    }
    return inventory;
  }

  /**
   * Atomically locks stock reservations for checkout items.
   * If any single item fails due to stock shortfall, it rolls back (unlocks) all previously locked items in this request.
   */
  public static async lockStock(items: InventoryItem[]): Promise<void> {
    const successfullyLocked: InventoryItem[] = [];

    try {
      for (const item of items) {
        // Find document where stock is sufficient, and increment reserved count while decrementing stock atomically
        const updated = await Inventory.findOneAndUpdate(
          {
            productId: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
              reserved: item.quantity,
            },
          },
          { new: true }
        );

        if (!updated) {
          throw new InsufficientStockError(
            `Insufficient stock available for product ID ${item.productId}. Requested: ${item.quantity}.`
          );
        }

        successfullyLocked.push(item);
      }
    } catch (error) {
      // Compensating Transaction: Roll back all successful locks to restore stock levels
      for (const rollbackItem of successfullyLocked) {
        await Inventory.findOneAndUpdate(
          { productId: rollbackItem.productId },
          {
            $inc: {
              stock: rollbackItem.quantity,
              reserved: -rollbackItem.quantity,
            },
          }
        );
      }
      throw error;
    }
  }

  /**
   * Releases locked stock reservations (e.g. if Saga cancels checkout or payment fails).
   */
  public static async unlockStock(items: InventoryItem[]): Promise<void> {
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        {
          productId: item.productId,
          reserved: { $gte: item.quantity },
        },
        {
          $inc: {
            stock: item.quantity,
            reserved: -item.quantity,
          },
        }
      );
    }
  }

  /**
   * Commits locked stock reservations permanently (e.g. upon payment completion).
   */
  public static async commitStock(items: InventoryItem[]): Promise<void> {
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        {
          productId: item.productId,
          reserved: { $gte: item.quantity },
        },
        {
          $inc: {
            reserved: -item.quantity,
          },
        }
      );
    }
  }

  /**
   * Updates raw stock levels for a product (admin tool).
   */
  public static async updateStock(productId: number, newStock: number): Promise<IInventory> {
    let inventory = await Inventory.findOne({ productId });
    
    if (inventory) {
      inventory.stock = newStock;
      await inventory.save();
    } else {
      inventory = new Inventory({
        productId,
        stock: newStock,
        reserved: 0,
      });
      await inventory.save();
    }

    return inventory;
  }

  /**
   * Bulk seeds starting stocks for testing.
   */
  public static async seedStock(items: { productId: number; stock: number }[]): Promise<void> {
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId },
        {
          $setOnInsert: { reserved: 0 },
          $set: { stock: item.stock },
        },
        { upsert: true, new: true }
      );
    }
  }
}
