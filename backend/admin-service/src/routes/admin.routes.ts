/**
 * @file backend/admin-service/src/routes/admin.routes.ts
 * 
 * @why-file-exists
 * Binds public-facing URL routes to AdminController execution logic.
 * 
 * @why-pattern-selected
 * Router pattern. Isolates administrative reports pathways from public storefront paths.
 * 
 * @performance-impact
 * Negligible. Route evaluation takes constant execution times.
 * 
 * @scaling-considerations
 * Allows versioning namespaces to wrap routes seamlessly under routes groupings.
 */

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.get('/dashboard/summary', AdminController.getSummary);

export default router;
