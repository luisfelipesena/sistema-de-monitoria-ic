import { logger } from '@/utils/logger';
import { createMiddleware } from '.';

const log = logger.child({
  context: 'logging requests',
});

/**
 * Request logging middleware
 */
export const requestLogger = createMiddleware(async (ctx, next) => {
  const start = Date.now();
  const { method, url } = ctx.request;

  // Log the request
  log.info(`[INCOMING] ${method} ${url}`);

  try {
    // Continue to the next middleware or route handler
    const response = await next();

    // Log the response
    const duration = Date.now() - start;
    const status = response?.status || 200;

    log.info(`[OUTGOING] ${method} ${url} ${status} - ${duration}ms`);

    return response;
  } catch (error) {
    // Log the error
    const duration = Date.now() - start;
    log.error(`[ERROR] ${method} ${url} ERROR - ${duration}ms`, error);

    // Rethrow the error to be handled by error handler middleware
    throw error;
  }
});

/**
 * Error handling middleware
 */
export const errorHandler = createMiddleware(async (ctx, next) => {
  try {
    // Continue to the next middleware or route handler
    return await next();
  } catch (error) {
    // Log the error
    log.error('Unhandled error:', error);

    // Return a formatted error response
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 