/**
 * @file backend/auth-service/src/controllers/auth.controller.ts
 * 
 * @why-file-exists
 * Receives incoming HTTP requests, validates request payloads using Zod schemas, 
 * invokes domain services, and handles HTTP responses.
 * 
 * @why-pattern-selected
 * Model-View-Controller (MVC) Controller pattern. Decouples Express HTTP request/response mappings 
 * from the underlying database models and domain business logic.
 * 
 * @alternative-approaches
 * - Direct routing query logic: Blurs the boundary between transport protocol handling (Express) and core 
 *   security rules, reducing modularity.
 * 
 * @performance-impact
 * Minimal. Serves as a stateless execution router.
 * 
 * @scaling-considerations
 * Keeps Express route layers thin, allowing controllers to be easily tested or reused under 
 * alternative frameworks (e.g. switching from Express to NestJS or Fastify).
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  /**
   * HTTP Handler for user registration.
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedResult = registerSchema.safeParse(req.body);
      if (!parsedResult.success) {
        throw new BadRequestError(parsedResult.error.errors[0].message);
      }

      const createdUser = await AuthService.registerUser({
        email: parsedResult.data.email,
        username: parsedResult.data.username,
        passwordHash: parsedResult.data.password, // Passed as raw, will be hashed in model hook
        firstname: parsedResult.data.firstname,
        lastname: parsedResult.data.lastname,
        phone: parsedResult.data.phone,
      });

      res.status(201).json({
        status: 'success',
        message: 'Account successfully registered.',
        data: { user: createdUser },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP Handler for credentials authentication.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedResult = loginSchema.safeParse(req.body);
      if (!parsedResult.success) {
        throw new BadRequestError(parsedResult.error.errors[0].message);
      }

      const result = await AuthService.loginUser({
        username: parsedResult.data.username,
        password: parsedResult.data.password,
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP Handler for refresh token rotation.
   */
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedResult = refreshTokenSchema.safeParse(req.body);
      if (!parsedResult.success) {
        throw new BadRequestError(parsedResult.error.errors[0].message);
      }

      const rotatedTokens = await AuthService.rotateRefreshToken(parsedResult.data.refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token successfully rotated.',
        data: rotatedTokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP Handler for token revocation (logout).
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedResult = refreshTokenSchema.safeParse(req.body);
      if (!parsedResult.success) {
        throw new BadRequestError(parsedResult.error.errors[0].message);
      }

      await AuthService.revokeRefreshToken(parsedResult.data.refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Session successfully terminated.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP Handler to fetch authenticated session credentials using gateway headers.
   */
  public static me(req: Request, res: Response): void {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const username = req.headers['x-user-username'];

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'No active session credentials found.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: parseInt(userId as string, 10),
          username,
          role,
        },
      },
    });
  }
}
