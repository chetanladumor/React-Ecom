/**
 * @file backend/auth-service/src/routes/auth.routes.ts
 * 
 * @why-file-exists
 * Declares the Express Router instance binding URLs endpoints to AuthController operations.
 * 
 * @why-pattern-selected
 * Router pattern. Segregates request URL pathways per feature module.
 * 
 * @alternative-approaches
 * - Defining routes directly in the main server start index.ts: Clutters startup scripts, 
 *   reducing code readability and service separation.
 * 
 * @performance-impact
 * Router path-matching has O(N) evaluation time, where N is the number of routes. Kept small and efficient.
 * 
 * @scaling-considerations
 * Clean path modularity enables registering these routes dynamically under sub-paths or version namespaces (e.g. `/v1/auth`).
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);

export default router;
