/**
 * @file backend/api-gateway/src/routes/proxy.routes.ts
 * 
 * @why-file-exists
 * Maps external path patterns to internal microservice endpoints, acting as a single entry point reverse-proxy.
 * 
 * @why-pattern-selected
 * Reverse Proxy pattern using `http-proxy-middleware`. It transparently forwards incoming payloads 
 * and handles connection streams between client sockets and backend service containers.
 * 
 * @alternative-approaches
 * - Custom fetch routing logic: Highly buggy. Hard to stream file uploads, manage headers correctly, 
 *   or handle connection timeouts without duplicating library logic.
 * - Hardware gateways (Nginx/Kong): Extremely fast, but writing custom Node.js/Express validation middlewares 
 *   (like rate limiting or auth validations) is simpler to maintain in JavaScript.
 * 
 * @performance-impact
 * Negligible overhead. Node.js is excellent at proxying network streams since it is built on asynchronous, non-blocking I/O.
 * 
 * @scaling-considerations
 * Stateless design. We can run multiple API Gateway containers behind a simple Load Balancer 
 * (like AWS ALB or Cloudflare) to scale throughput infinitely.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { ClientRequest } from 'http';
import { config } from '../config/gateway.config';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Helper to dynamically construct http-proxy-middleware instances per service.
 */
const setupProxy = (pathPrefix: string, target: string) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${pathPrefix}`]: '', // Remove service path prefix from the forwarded path
    },
    onProxyReq: (proxyReq: ClientRequest, req: Request) => {
      // Propagate Correlation ID and decoded user details downstream
      if (req.correlationId) {
        proxyReq.setHeader('x-correlation-id', req.correlationId);
      }
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id'] as string);
      }
      if (req.headers['x-user-role']) {
        proxyReq.setHeader('x-user-role', req.headers['x-user-role'] as string);
      }
      if (req.headers['x-user-username']) {
        proxyReq.setHeader('x-user-username', req.headers['x-user-username'] as string);
      }
    },
    onError: (err: Error, req: Request, res: Response) => {
      logger.error(`Proxy failure connecting to ${target}: ${err.message}`, {
        correlationId: req.correlationId || 'unknown',
      });
      
      const responseObj = res as unknown as { headersSent: boolean; status: (code: number) => { json: (body: object) => void } };
      if (!responseObj.headersSent) {
        responseObj.status(502).json({
          status: 'error',
          message: `Bad Gateway. Service is temporarily unreachable.`,
          correlationId: req.correlationId,
        });
      }
    },
  });
};

// Register downstream proxies
router.use('/auth', setupProxy('/api/v1/auth', config.services.auth));
router.use('/products', setupProxy('/api/v1/products', config.services.product));
router.use('/cart', setupProxy('/api/v1/cart', config.services.cart));
router.use('/wishlist', setupProxy('/api/v1/wishlist', config.services.wishlist));
router.use('/orders', setupProxy('/api/v1/orders', config.services.order));
router.use('/inventory', setupProxy('/api/v1/inventory', config.services.inventory));
router.use('/reviews', setupProxy('/api/v1/reviews', config.services.reviews));
router.use('/admin', setupProxy('/api/v1/admin', config.services.admin));

export default router;
