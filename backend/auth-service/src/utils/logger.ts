/**
 * @file backend/auth-service/src/utils/logger.ts
 * 
 * @why-file-exists
 * Provides structured logging for the Auth Service. Logs key lifecycle operations 
 * (registrations, login attempts, token rotations, connection failures) in standard JSON format.
 * 
 * @why-pattern-selected
 * Winston structured logger pattern. Allows filtering logs by severity (info, warn, error) 
 * and outputs timestamped details with metadata mapping.
 * 
 * @alternative-approaches
 * - Standard Console API: Lacks severity levels, JSON structuring, and asynchronous output writing.
 * 
 * @performance-impact
 * Winston writes asynchronously to prevent event-loop delays. Very low overhead.
 * 
 * @scaling-considerations
 * Outputs to stdout/stderr. Standard logs collection daemons (e.g. Fluentd) harvest 
 * these streams to aggregate them into central index logs (Elasticsearch/Splunk) for searching.
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
