/**
 * @file backend/inventory-service/src/controllers/inventory.controller.ts
 * 
 * @why-file-exists
 * Maps incoming HTTP requests to business service functions and formats response payloads.
 * 
 * @why-pattern-selected
 * Model-View-Controller (MVC) Controller pattern. Decouples Express HTTP routes from business locking logic.
 * 
 * @alternative-approaches
 * - Routing path inline handlers: Clutters route layouts, making route mapping difficult to read.
 * 
 * @performance-impact
 * stateless proxy. Low overhead.
 * 
 * @scaling-considerations
 * Keeps Express route layers thin, allowing controllers to be easily tested or reused under 
 * alternative frameworks (e.g. switching from Express to NestJS or Fastify).
 */

import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { BadRequestError } from '../utils/errors';

export class InventoryController {
  /**
   * GET /inventory/:productId
   */
  public static async getStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }

      const inventory = await InventoryService.getStockByProduct(productId);
      res.status(200).json({
        productId: inventory.productId,
        stock: inventory.stock,
        reserved: inventory.reserved,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /inventory/lock
   */
  public static async lock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required.');
      }

      await InventoryService.lockStock(items);
      res.status(200).json({
        status: 'success',
        message: 'Stock successfully reserved.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /inventory/unlock
   */
  public static async unlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required.');
      }

      await InventoryService.unlockStock(items);
      res.status(200).json({
        status: 'success',
        message: 'Stock reservation successfully released.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /inventory/commit
   */
  public static async commit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required.');
      }

      await InventoryService.commitStock(items);
      res.status(200).json({
        status: 'success',
        message: 'Stock reservation successfully committed.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /inventory/:productId
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId, 10);
      const { stock } = req.body;

      if (isNaN(productId)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }
      if (typeof stock !== 'number' || stock < 0) {
        throw new BadRequestError('Stock must be a non-negative number.');
      }

      const updated = await InventoryService.updateStock(productId, stock);
      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /inventory/seed
   */
  public static async seed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        throw new BadRequestError('Items array is required for seeding.');
      }

      await InventoryService.seedStock(items);
      res.status(200).json({
        status: 'success',
        message: 'Inventory successfully seeded.',
      });
    } catch (error) {
      next(error);
    }
  }
}
