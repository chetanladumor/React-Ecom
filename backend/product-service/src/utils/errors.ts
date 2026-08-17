/**
 * @file backend/product-service/src/utils/errors.ts
 * 
 * @why-file-exists
 * Declares reusable, HTTP-augmented exception classes specific to catalog operations.
 * 
 * @why-pattern-selected
 * Exception Inheritance pattern. Extends JS `Error` with `statusCode` fields to support Express error routers.
 * 
 * @alternative-approaches
 * - Direct throw statements with custom JSON payloads: Brittle, harder to catch uniformly.
 * 
 * @performance-impact
 * Negligible. Captures standard V8 stack frames on construction.
 * 
 * @scaling-considerations
 * Returns standard REST response codes (400, 404, 500) to ensure the API Gateway and frontend 
 * can handle missing items or invalid query parameters gracefully.
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

export class NotFoundError extends AppError {
  constructor(message = 'Product or Category Not Found') {
    super(message, 404);
  }
}
