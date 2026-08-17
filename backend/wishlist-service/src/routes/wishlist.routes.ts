/**
 * @file backend/wishlist-service/src/routes/wishlist.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to WishlistController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates wishlist-related pathways from other microservices domains.
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
import { WishlistController } from '../controllers/wishlist.controller';

const router = Router();

router.get('/', WishlistController.getWishlist);
router.post('/toggle', WishlistController.toggleProduct);
router.delete('/', WishlistController.clearWishlist);

export default router;
