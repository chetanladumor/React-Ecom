/**
 * @file backend/api-gateway/src/middlewares/auth.middleware.ts
 * 
 * @why-file-exists
 * Validates incoming JSON Web Tokens (JWT) at the entrance of the system (API Gateway)
 * instead of duplicating verification logic across all downstream microservices.
 * 
 * @why-pattern-selected
 * Gateway Token Exchange pattern. Validates signature once, then propagates identity metadata 
 * (User ID, Role) to downstream microservices using clean headers (`x-user-id`, `x-user-role`).
 * 
 * @alternative-approaches
 * - Verifying tokens inside each individual service: Anti-pattern. Introduces code duplication, 
 *   requires sharing database access sessions or calling an Auth microservice over HTTP (causing latency).
 * 
 * @performance-impact
 * JWT validation is an in-memory cryptographic operation (using HMAC-SHA256). Very fast, but 
 * caching validation outcomes in Redis is a scaling option for ultra-high traffic gateways.
 * 
 * @scaling-considerations
 * Decouples authorization secrets from downstream codebases. If token signatures need 
 * key rotation, only the Gateway config needs updates.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/gateway.config';
import { UnauthorizedError } from '../utils/errors';

interface DecodedToken {
  id: number;
  username: string;
  role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token is provided, let it pass (public request). Downstream services will enforce 
    // access limits if needed by checking for the x-user-id header.
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;

    // Inject identity headers for downstream microservices
    req.headers['x-user-id'] = decoded.id.toString();
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-username'] = decoded.username;

    next();
  } catch (error) {
    // If a malformed or expired token is passed, reject immediately
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
};
