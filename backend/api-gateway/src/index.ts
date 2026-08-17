/**
 * @file backend/api-gateway/src/index.ts
 * 
 * @why-file-exists
 * Serves as the bootstrapping script that starts the API Gateway Express HTTP server 
 * and binds all global security, logging, routing, and error interceptor middlewares.
 * 
 * @why-pattern-selected
 * Orchestrator pattern. Bootstraps the application runtime dependencies sequentially 
 * (config -> logger -> safety check -> server bind).
 * 
 * @alternative-approaches
 * - Splitting server bootstrap into separate server/index modules: Clean, but for a simple 
 *   stateless gateway, a consolidated index.ts file is highly readable.
 * 
 * @performance-impact
 * Negligible startup overhead. The server starts listening on the configured TCP port 
 * in an asynchronous, non-blocking network socket loop.
 * 
 * @scaling-considerations
 * Enables horizontal scaling. We bind to dynamic ports via environments so container 
 * managers can orchestrate multiple gateway instances seamlessly.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/gateway.config';
import { logger } from './utils/logger';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import proxyRouter from './routes/proxy.routes';

const app = express();

// 1. Core Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// 3. Response Compression (Gzip)
app.use(compression());

// 4. Rate Limiting to prevent brute-force / DDoS attacks
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// 5. Custom Correlation Tracing & Access Logging
app.use(loggerMiddleware);

// 6. Global JWT Token parsing & downstream headers injection
app.use(authMiddleware);

// Healthcheck endpoint (Stateless)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// 7. Proxy Routing Table
app.use('/api/v1', proxyRouter);

// 8. Global Error Interceptor
app.use(errorMiddleware);

// Start Server listening
const server = app.listen(config.port, () => {
  logger.info(`API Gateway active in [${config.env}] on port ${config.port}`);
});

// Graceful Shutdown handling to avoid cutting off active network streams
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    logger.info('API Gateway server shut down successfully.');
    process.exit(0);
  });
});
