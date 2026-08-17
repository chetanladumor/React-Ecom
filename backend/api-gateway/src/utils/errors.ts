/**
 * @file backend/api-gateway/src/utils/errors.ts
 * 
 * @why-file-exists
 * Establishes structured, domain-specific exception classes. This enables middlewares and controllers 
 * to handle expected errors cleanly without leaking internal stack traces.
 * 
 * @why-pattern-selected
 * Exception Inheritance (extending base Error) is chosen to maintain compatibility with standard JS throw/catch semantics 
 * while enriching exceptions with HTTP-specific fields like `statusCode` and `isOperational`.
 * 
 * @alternative-approaches
 * - Throwing plain strings or dictionary structures: Very fragile. Loses standard stack trace frames and type-safety check guarantees.
 * - Single Error Class with dynamic type code: Can get bloated. Harder to type-narrow using TypeScript's `instanceof` check.
 * 
 * @performance-impact
 * Constructing standard Error objects captures JavaScript engine stack traces which can have minor CPU cost. Limit error creation 
 * to actual abnormal execution flows rather than normal flow controls.
 * 
 * @scaling-considerations
 * Unified status codes and structural fields ensure centralized monitoring agents can categorize logs and trigger 
 * alerts automatically based on error classes (e.g. tracking spike rates on 401 Unauthorized vs. 500 Internal errors).
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

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests - Please try again later') {
    super(message, 429);
  }
}
