/**
 * @file backend/wishlist-service/src/services/wishlist.service.ts
 * 
 * @why-file-exists
 * Encapsulates the business logic for wishlists fetching, item toggles (add/remove), 
 * and clears.
 * 
 * @why-pattern-selected
 * Domain Service layer pattern. Decouples controllers from direct DB updates and isolates query logic.
 * 
 * @alternative-approaches
 * - Writing DB queries directly inside Express route handlers: Anti-pattern. Makes components un-testable.
 * 
 * @performance-impact
 * Uses array check operations. Saves in a single document update.
 * 
 * @scaling-considerations
 * State is saved persistently in MongoDB, allowing the Wishlist microservice containers to remain stateless 
 * and scale out horizontally.
 */

import { Wishlist, IWishlist } from '../models/wishlist.model';

export class WishlistService {
  /**
   * Retrieves a user's wishlist. If none exists, automatically initializes a new blank wishlist.
   */
  public static async getOrCreateWishlist(userId: number): Promise<IWishlist> {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: [],
      });
      await wishlist.save();
    }
    return wishlist;
  }

  /**
   * Toggles a product in the wishlist. If it exists, removes it. If it doesn't, adds it.
   */
  public static async toggleProduct(userId: number, productId: number): Promise<IWishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const index = wishlist.products.indexOf(productId);
    if (index > -1) {
      // Product exists, remove it
      wishlist.products.splice(index, 1);
    } else {
      // Product does not exist, add it
      wishlist.products.push(productId);
    }

    await wishlist.save();
    return wishlist;
  }

  /**
   * Clears all products from the user's wishlist.
   */
  public static async clearWishlist(userId: number): Promise<IWishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);
    wishlist.products = [];
    await wishlist.save();
    return wishlist;
  }
}
