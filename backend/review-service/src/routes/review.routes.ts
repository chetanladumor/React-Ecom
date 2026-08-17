/**
 * @file backend/review-service/src/routes/review.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to ReviewController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates review-related pathways from other microservices domains.
 * 
 * @alternative-approaches
 * - Flat route structure inside entry server index.ts: Reduces modularity and clarity.
 * 
 * @performance-impact
 * Negligible. Route evaluation takes constant execution times.
 * 
 * @scaling-considerations
 * Allows versioning namespaces to wrap routes seamlessly under routes groupings.
 */

import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();

router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/', ReviewController.submitReview);
router.delete('/product/:productId', ReviewController.deleteReview);

export default router;
