/**
 * @file backend/product-service/src/controllers/product.controller.ts
 * 
 * @why-file-exists
 * Maps transport protocols (HTTP requests/responses) to underlying business operations in ProductService.
 * 
 * @why-pattern-selected
 * Model-View-Controller (MVC) Controller pattern. Decouples path variable parsing from cache/database operations.
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
import { ProductService } from '../services/product.service';
import { BadRequestError } from '../utils/errors';

export class ProductController {
  /**
   * GET /products
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        sort: req.query.sort as 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | undefined,
      };

      const products = await ProductService.queryProducts(filters);
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /products/:id
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }

      const product = await ProductService.getProductById(id);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /categories
   */
  public static async categories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ProductService.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /products (Admin)
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In production, we validate req.body with a Zod schema. 
      // For simplicity in Phase 3, we forward it to the service directly.
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /products/:id (Admin)
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }

      const product = await ProductService.updateProduct(id, req.body);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /products/:id (Admin)
   */
  public static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError('Product ID must be a valid number.');
      }

      await ProductService.deleteProduct(id);
      res.status(200).json({
        status: 'success',
        message: `Product ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
