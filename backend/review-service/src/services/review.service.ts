/**
 * @file backend/review-service/src/services/review.service.ts
 * 
 * @why-file-exists
 * Encapsulates core business logic for review creations, upsert mappings, 
 * rating aggregations, and catalog updating triggers.
 * 
 * @why-pattern-selected
 * Domain Service layer pattern. Isolates database aggregations and triggers catalog update 
 * broadcasts asynchronously.
 * 
 * @alternative-approaches
 * - Updating the Product Service database directly from Review Service: Anti-pattern. Violates 
 *   microservice database isolation boundaries.
 * 
 * @performance-impact
 * Uses MongoDB aggregation pipeline ($avg, $sum) on indices. Very fast.
 * 
 * @scaling-considerations
 * State is saved persistently in MongoDB, allowing the Review microservice containers to remain stateless 
 * and scale out horizontally.
 */

import { Review, IReview } from '../models/review.model';
import { publishEvent } from '../events/publisher';
import { NotFoundError } from '../utils/errors';

export class ReviewService {
  /**
   * Fetches all reviews submitted for a specific product.
   */
  public static async getProductReviews(productId: number): Promise<IReview[]> {
    return Review.find({ productId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Submits or updates a customer review for a product, then broadcasts the recalculated average.
   */
  public static async createOrUpdateReview(
    productId: number,
    userId: number,
    userName: string,
    rating: number,
    comment: string
  ): Promise<IReview> {
    // 1. Upsert review
    const review = await Review.findOneAndUpdate(
      { productId, userId },
      { userName, rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    // 2. Recalculate average rating & review count for the product
    await this.syncProductRating(productId);

    return review;
  }

  /**
   * Deletes a review and broadcasts the recalculated rating metrics.
   */
  public static async deleteReview(productId: number, userId: number): Promise<void> {
    const result = await Review.deleteOne({ productId, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError(`Review not found for user ${userId} on product ${productId}.`);
    }

    // Recalculate ratings
    await this.syncProductRating(productId);
  }

  /**
   * Aggregates review metrics and publishes `review.updated` event.
   */
  private static async syncProductRating(productId: number): Promise<void> {
    const stats = await Review.aggregate([
      { $match: { productId } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const rate = stats.length > 0 ? parseFloat(stats[0].averageRating.toFixed(1)) : 0;
    const count = stats.length > 0 ? stats[0].reviewCount : 0;

    // Publish event to inform Product Catalog Service to update its cache & document
    await publishEvent('review.updated', {
      productId,
      rate,
      count,
    });
  }
}
