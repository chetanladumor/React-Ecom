/**
 * @file backend/cart-service/src/routes/cart.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to CartController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates cart-related pathways from other microservices domains.
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
import { CartController } from '../controllers/cart.controller';

const router = Router();

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.put('/items/:productId', CartController.updateItem);
router.delete('/items/:productId', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
