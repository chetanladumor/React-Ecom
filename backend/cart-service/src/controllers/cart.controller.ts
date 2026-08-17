/**
 * @file backend/cart-service/src/controllers/cart.controller.ts
 * 
 * @why-file-exists
 * Maps incoming HTTP requests to business operations in CartService, extracting user identity 
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
import { CartService } from '../services/cart.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class CartController {
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
  public static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = CartController.getUserId(req);
      const cart = await CartService.getOrCreateCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /items
   */
  public static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = CartController.getUserId(req);
      const { productId, quantity } = req.body;

      if (typeof productId !== 'number') {
        throw new BadRequestError('Product ID is required and must be a number.');
      }
      if (typeof quantity !== 'number' || quantity < 1) {
        throw new BadRequestError('Quantity is required and must be a number >= 1.');
      }

      const cart = await CartService.addItem(userId, productId, quantity);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /items/:productId
   */
  public static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = CartController.getUserId(req);
      const productId = parseInt(req.params.productId, 10);
      const { quantity } = req.body;

      if (isNaN(productId)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }
      if (typeof quantity !== 'number') {
        throw new BadRequestError('Quantity is required and must be a number.');
      }

      const cart = await CartService.updateItemQuantity(userId, productId, quantity);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /items/:productId
   */
  public static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = CartController.getUserId(req);
      const productId = parseInt(req.params.productId, 10);

      if (isNaN(productId)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }

      const cart = await CartService.removeItem(userId, productId);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /
   */
  public static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = CartController.getUserId(req);
      const cart = await CartService.clearCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  }
}
