import { applyMiddleware, type AppState, type MiddlewareContext } from '.';
import { requireAuth, requireRole } from './auth';
import { errorHandler, requestLogger } from './logging';

/**
 * Standard middleware stack for public API routes
 * Includes error handling and request logging
 */
export function withPublicMiddleware<State extends AppState = AppState>(handler: (ctx: MiddlewareContext<State>) => Promise<Response> | Response) {
  return applyMiddleware<State>(
    handler,
    errorHandler as any,
    requestLogger as any
  );
}

/**
 * Standard middleware stack for authenticated API routes
 * Includes error handling, request logging, and authentication
 * Guarantees that ctx.state.user is present in the handler
 */
export function withAuthMiddleware<State extends AppState = AppState & { user: NonNullable<AppState['user']> }>(
  handler: (ctx: MiddlewareContext<State>) => Promise<Response> | Response
) {
  return applyMiddleware<State>(
    handler,
    errorHandler as any,
    requestLogger as any,
    requireAuth as any
  );
}

/**
 * Standard middleware stack for role-protected API routes
 * Includes error handling, request logging, authentication, and role checking
 * Guarantees that ctx.state.user is present in the handler
 */
export function withRoleMiddleware<State extends AppState = AppState & { user: NonNullable<AppState['user']> }>(
  roles: string[],
  handler: (ctx: MiddlewareContext<State>) => Promise<Response> | Response
) {
  return applyMiddleware<State>(
    handler,
    errorHandler as any,
    requestLogger as any,
    requireAuth as any,
    requireRole(roles) as any
  );
}

/**
 * Creates a handler that can be used directly with API routes
 */
export function createAPIHandler<State extends AppState = AppState>(
  middlewareStack: (ctx: MiddlewareContext<State>) => Promise<Response> | Response
) {
  return ({ request, params }: { request: Request; params: Record<string, string> }) => {
    return middlewareStack({
      request,
      params: params || {},
      state: {} as State
    });
  };
} 