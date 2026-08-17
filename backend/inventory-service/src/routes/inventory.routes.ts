/**
 * @file backend/inventory-service/src/routes/inventory.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to InventoryController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates inventory-related pathways from other microservices domains.
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
import { InventoryController } from '../controllers/inventory.controller';

const router = Router();

router.get('/:productId', InventoryController.getStock);
router.post('/lock', InventoryController.lock);
router.post('/unlock', InventoryController.unlock);
router.post('/commit', InventoryController.commit);
router.put('/:productId', InventoryController.update);
router.post('/seed', InventoryController.seed);

export default router;
