/**
 * @file backend/api-gateway/src/middlewares/logger.middleware.ts
 * 
 * @why-file-exists
 * Intercepts all incoming requests to log routing activity, performance metrics (latency), 
 * and generate Correlation IDs for tracing transactions across independent microservices.
 * 
 * @why-pattern-selected
 * Correlation ID (Request ID) propagation pattern. It leverages Express routing middleware pipelines 
 * to attach tracing metadata to both incoming headers and outgoing response headers.
 * 
 * @alternative-approaches
 * - Logging inside individual microservices without a correlation ID: Hard to track requests. 
 *   If a checkout fails, tracing logs across 4 services without a common ID is almost impossible.
 * 
 * @performance-impact
 * Negligible. Adding a correlation header takes constant O(1) time. Response duration calculation 
 * uses high-precision timers (`process.hrtime`).
 * 
 * @scaling-considerations
 * Essential for microservice scaling. When multiple containers handle parts of a single request flow, 
 * search aggregators (e.g. Kibana) can filter all container logs using the matching `x-correlation-id`.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract existing Correlation ID (or generate a new one if this is the entry request)
  const correlationId = (req.headers['x-correlation-id'] as string) || `cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  const startTime = process.hrtime();

  // Log request arrival
  logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
    correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Intercept response finish event to log completion latency
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    logger.info(`Completed ${req.method} ${req.originalUrl} - ${res.statusCode} in ${durationMs}ms`, {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};
