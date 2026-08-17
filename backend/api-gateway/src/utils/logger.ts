/**
 * @file backend/api-gateway/src/utils/logger.ts
 * 
 * @why-file-exists
 * Provides a centralized, structured logging mechanism for the API Gateway. 
 * Captures request routing, rate limits, exceptions, and lifecycle states in a consistent format.
 * 
 * @why-pattern-selected
 * Winston is selected as the logging framework because it supports multi-transport destinations (Console, File, Logstash),
 * customizable log levels (RFC5424), and structured log formatting (JSON).
 * 
 * @alternative-approaches
 * - Console.log: Too primitive. Lacks log-level controls, transport channels, and structured JSON output.
 * - Bunyan / Pino: High-performance JSON loggers. Pino is faster, but Winston is more extensible and simpler to integrate.
 * 
 * @performance-impact
 * Winston writes asynchronously by default to avoid blocking the single-threaded event loop. Console writes can block 
 * execution when output buffers overflow under high request loads.
 * 
 * @scaling-considerations
 * Logs are output as structured JSON to standard output (stdout). In production, container logging daemons (e.g. FluentBit, 
 * Logstash) capture stdout streams and aggregate them into search clusters (Elasticsearch, Loki) for centralized querying.
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
