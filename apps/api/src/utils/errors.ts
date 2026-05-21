import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

// ============================================
// ERROR RESPONSE INTERFACE
// ============================================

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Default error response
  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };

  let statusCode = 500;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response.error.message = 'Validation error';
    response.error.code = 'VALIDATION_ERROR';
    response.error.details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.message = err.message;
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      response.error.message = 'Resource already exists';
      response.error.code = 'DUPLICATE_ENTRY';
      response.error.details = prismaError.meta?.target;
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      response.error.message = 'Resource not found';
      response.error.code = 'NOT_FOUND';
    }
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.error.message = 'Invalid token';
    response.error.code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.error.message = 'Token expired';
    response.error.code = 'TOKEN_EXPIRED';
  }
  // Development: include stack trace
  else if (process.env.NODE_ENV === 'development') {
    response.error.message = err.message;
  }

  res.status(statusCode).json(response);
}

// ============================================
// ASYNC HANDLER WRAPPER
// ============================================

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
