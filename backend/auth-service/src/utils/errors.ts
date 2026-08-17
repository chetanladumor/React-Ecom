/**
 * @file backend/auth-service/src/utils/errors.ts
 * 
 * @why-file-exists
 * Declares domain-specific error classes for the Auth Service.
 * 
 * @why-pattern-selected
 * Exception hierarchy pattern extending the base JS `Error` class, supplying standard `statusCode` metadata.
 * 
 * @alternative-approaches
 * - Direct throw statements with custom JSON payloads: Brittle, harder to intercept uniformly in Express.
 * 
 * @performance-impact
 * Negligible. Captures standard V8 engine stack frames when exceptions occur.
 * 
 * @scaling-considerations
 * Returns standard REST response codes (400, 401, 403, 404, 409) so Gateway and upstream clients 
 * can react correctly to token expirations, registration conflicts, or verification errors.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource Conflict') {
    super(message, 409);
  }
}
