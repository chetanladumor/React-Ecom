/**
 * @file backend/product-service/src/utils/logger.ts
 * 
 * @why-file-exists
 * Provides structured logging for the Product Service. Logs catalog retrievals, 
 * cache hits/misses, and database query executions.
 * 
 * @why-pattern-selected
 * Winston structured logger. Standardizes formatting and allows setting logs levels via environment variables.
 * 
 * @alternative-approaches
 * - Standard Console logging: Lacks log level routing, timestamp structuring, or JSON formatting.
 * 
 * @performance-impact
 * Negligible. Winston writes asynchronously, leaving the event loop free to handle connections.
 * 
 * @scaling-considerations
 * Emits log objects to stdout/stderr. These are captured by container logging layers 
 * and forwarded to log aggregators (e.g. Loki, Elasticsearch).
 */

import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, correlationId, stack }) => {
          const cid = correlationId ? ` [CID: ${correlationId}]` : '';
          return `${timestamp} [${level}]${cid}: ${message} ${stack || ''}`;
        })
      ),
    }),
  ],
});
