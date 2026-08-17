/**
 * @file backend/wishlist-service/src/controllers/wishlist.controller.ts
 * 
 * @why-file-exists
 * Maps incoming HTTP requests to business operations in WishlistService, extracting user identity 
 * from the gateway-provided request headers.
 * 
 * @why-pattern-selected
 * Model-View-Controller (MVC) Controller pattern. Decouples header checking and type conversion 
 * from database mutations.
 * 
 * @alternative-approaches
 * - Routing path inline handlers: Clutters route layouts, making route mapping difficult to read.
 * 
 * @performance-impact
 * stateless proxy. Low overhead.
 * 
 * @scaling-considerations
 * Decouples JWT authentication logic. The controller trusts headers forwarded by the API Gateway 
 * which scales auth validation and prevents token signature re-verifications in each service.
 */

import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class WishlistController {
  /**
   * Helper to retrieve validated userId from Gateway headers.
   */
  private static getUserId(req: Request): number {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader) {
      throw new UnauthorizedError('Unauthorized. Identity headers not found.');
    }
    const userId = parseInt(userIdHeader as string, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('Invalid User ID provided in headers.');
    }
    return userId;
  }

  /**
   * GET /
   */
  public static async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = WishlistController.getUserId(req);
      const wishlist = await WishlistService.getOrCreateWishlist(userId);
      res.status(200).json(wishlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /toggle
   */
  public static async toggleProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = WishlistController.getUserId(req);
      const { productId } = req.body;

      if (typeof productId !== 'number') {
        throw new BadRequestError('Product ID is required and must be a number.');
      }

      const wishlist = await WishlistService.toggleProduct(userId, productId);
      res.status(200).json(wishlist);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /
   */
  public static async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = WishlistController.getUserId(req);
      const wishlist = await WishlistService.clearWishlist(userId);
      res.status(200).json(wishlist);
    } catch (error) {
      next(error);
    }
  }
}
