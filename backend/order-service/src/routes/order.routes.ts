/**
 * @file backend/order-service/src/routes/order.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to OrderController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates order-related pathways from other microservices domains.
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
import { OrderController } from '../controllers/order.controller';

const router = Router();

router.get('/', OrderController.getOrders);
router.post('/checkout', OrderController.checkout);
router.get('/:id', OrderController.getOrderById);

export default router;
