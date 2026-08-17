/**
 * @file backend/review-service/src/controllers/review.controller.ts
 * 
 * @why-file-exists
 * Maps incoming HTTP requests to business operations in ReviewService, extracting user identity 
 * and display names from the gateway-provided request headers.
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
import { ReviewService } from '../services/review.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class ReviewController {
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
   * Helper to retrieve userName from Gateway headers.
   */
  private static getUserName(req: Request): string {
    const userNameHeader = req.headers['x-user-name'];
    if (!userNameHeader) {
      return 'Anonymous Buyer'; // Fallback
    }
    return decodeURIComponent(userNameHeader as string);
  }

  /**
   * GET /product/:productId
   */
  public static async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        throw new BadRequestError('Invalid Product ID.');
      }

      const reviews = await ReviewService.getProductReviews(productId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /
   */
  public static async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = ReviewController.getUserId(req);
      const userName = ReviewController.getUserName(req);
      const { productId, rating, comment } = req.body;

      if (typeof productId !== 'number') {
        throw new BadRequestError('Product ID is required and must be a number.');
      }
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be a number between 1 and 5.');
      }
      if (typeof comment !== 'string' || !comment.trim()) {
        throw new BadRequestError('Comment is required.');
      }

      const review = await ReviewService.createOrUpdateReview(
        productId,
        userId,
        userName,
        rating,
        comment
      );
      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /product/:productId
   */
  public static async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = ReviewController.getUserId(req);
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        throw new BadRequestError('Invalid Product ID.');
      }

      await ReviewService.deleteReview(productId, userId);
      res.status(200).json({ status: 'success', message: 'Review successfully deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
