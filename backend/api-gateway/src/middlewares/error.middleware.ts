/**
 * @file backend/api-gateway/src/middlewares/error.middleware.ts
 * 
 * @why-file-exists
 * Catches all unhandled exceptions thrown by routes, proxies, or middlewares, 
 * returning a unified JSON error payload to the client.
 * 
 * @why-pattern-selected
 * Centralized Error Interception pattern. Ensures that server implementation details (like file paths, database queries, 
 * or internal microservice stack traces) are never leaked to external clients.
 * 
 * @alternative-approaches
 * - Try-catch blocks around every route/controller: Leads to highly cluttered code, code duplication, 
 *   and increased risk of missing uncaught exceptions.
 * 
 * @performance-impact
 * Negligible. Runs only when exceptions occur.
 * 
 * @scaling-considerations
 * Logs uncaught 500 exceptions immediately via Winston, which feeds alerting triggers 
 * (PagerDuty/Slack notifications) to wake engineers during serious production outages.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, {
      correlationId,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      correlationId,
    });
  }

  // Log unhandled non-operational errors
  logger.error(`Critical Unhandled Error: ${err.message}`, {
    correlationId,
    stack: err.stack,
  });

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server configuration error'
      : err.message;

  res.status(500).json({
    status: 'error',
    message,
    correlationId,
  });
};
