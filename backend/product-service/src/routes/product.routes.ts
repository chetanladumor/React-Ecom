/**
 * @file backend/product-service/src/routes/product.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to ProductController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates catalog-related pathways from other microservices domains.
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
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.list);
router.get('/categories', ProductController.categories);
router.get('/:id', ProductController.getById);

// Admin-specific actions (In a real system, these would check the x-user-role header)
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.remove);

export default router;
