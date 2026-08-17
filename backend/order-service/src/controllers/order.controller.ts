/**
 * @file backend/order-service/src/controllers/order.controller.ts
 * 
 * @why-file-exists
 * Maps incoming HTTP requests to business operations in OrderService, extracting user identity 
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
import { OrderService } from '../services/order.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class OrderController {
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
  public static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = OrderController.getUserId(req);
      const orders = await OrderService.getOrdersByUser(userId);
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /:id
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = OrderController.getUserId(req);
      const order = await OrderService.getOrderById(req.params.id);

      // Security check: Ensure order belongs to requester
      if (order.userId !== userId) {
        throw new UnauthorizedError('Access denied. Order belongs to another user account.');
      }

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /checkout
   */
  public static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = OrderController.getUserId(req);
      const { items, shippingAddress } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required for checkout.');
      }
      if (!shippingAddress) {
        throw new BadRequestError('Shipping Address is required for checkout.');
      }

      const order = await OrderService.createOrder(userId, items, shippingAddress);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }
}
