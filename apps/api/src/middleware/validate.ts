import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

interface ValidateOptions {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Validate request body, query, and/or params using Zod schemas
 */
export function validate(schemas: ValidateOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate only request body
 */
export function validateBody(schema: AnyZodObject) {
  return validate({ body: schema });
}

/**
 * Validate only query params
 */
export function validateQuery(schema: AnyZodObject) {
  return validate({ query: schema });
}

/**
 * Validate only route params
 */
export function validateParams(schema: AnyZodObject) {
  return validate({ params: schema });
}
