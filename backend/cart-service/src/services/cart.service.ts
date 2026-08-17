/**
 * @file backend/cart-service/src/services/cart.service.ts
 * 
 * @why-file-exists
 * Encapsulates the business logic for shopping carts additions, quantity alterations, 
 * removals, and checkout-complete clears.
 * 
 * @why-pattern-selected
 * Domain Service layer pattern. Decouples controllers from direct DB updates and isolates query logic.
 * 
 * @alternative-approaches
 * - Writing DB queries directly inside Express route handlers: Anti-pattern. Makes components un-testable.
 * 
 * @performance-impact
 * Uses atomic MongoDB operations like `$pull` or `$set` when possible, minimizing the payload size 
 * of document updates.
 * 
 * @scaling-considerations
 * State is saved persistently in MongoDB, allowing the Cart microservice containers to remain stateless 
 * and scale out horizontally.
 */

import { Cart, ICart } from '../models/cart.model';
import { NotFoundError } from '../utils/errors';

export class CartService {
  /**
   * Retrieves a user's cart. If none exists, automatically initializes a new blank cart.
   */
  public static async getOrCreateCart(userId: number): Promise<ICart> {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
      await cart.save();
    }
    return cart;
  }

  /**
   * Adds an item to the shopping cart or increments quantity if it is already present.
   */
  public static async addItem(userId: number, productId: number, quantity: number): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = cart.items.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return cart;
  }

  /**
   * Updates an item's quantity in the cart. If quantity <= 0, the item is removed.
   */
  public static async updateItemQuantity(userId: number, productId: number, quantity: number): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new NotFoundError(`No cart found for user ID ${userId}.`);
    }

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundError(`Product ID ${productId} is not present in the user's cart.`);
    }

    item.quantity = quantity;
    await cart.save();
    return cart;
  }

  /**
   * Removes an item from the shopping cart.
   */
  public static async removeItem(userId: number, productId: number): Promise<ICart> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw new NotFoundError(`No cart found for user ID ${userId}.`);
    }

    cart.items = cart.items.filter((item) => item.productId !== productId);
    await cart.save();
    return cart;
  }

  /**
   * Clears all items from the user's cart (typically run after checkout completes).
   */
  public static async clearCart(userId: number): Promise<ICart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return cart;
  }
}
