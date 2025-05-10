/**
 * Middleware utility for TanStack Start API routes
 */

// Define state interface for application
export interface AppState {
  user?: {
    userId: string;
    role: 'admin' | 'professor' | 'student';
    // Add other user properties as needed
  };
  // Add other state properties as needed
}

// The context type passed to each middleware
export type MiddlewareContext<State = AppState> = {
  request: Request;
  params: Record<string, string>;
  state: State;
};

// The next function type that middleware must call to continue
export type NextFunction = () => Promise<Response | null>;

// The middleware type definition
export type Middleware<State = AppState> = (
  context: MiddlewareContext<State>,
  next: NextFunction
) => Promise<Response | null>;

/**
 * Creates a middleware function for API routes
 */
export function createMiddleware<State = AppState>(
  handler: (ctx: MiddlewareContext<State>, next: NextFunction) => Promise<Response | null> | Response | null
): Middleware<State> {
  return async (ctx, next) => {
    return await handler(ctx, next);
  };
}

/**
 * Composes multiple middleware functions into a single middleware
 */
export function composeMiddleware<State = AppState>(...middlewares: Middleware<State>[]): Middleware<State> {
  return async (ctx, next) => {
    const executeMiddlewareChain = async (index: number): Promise<Response | null> => {
      // If we've run through all middleware, call the final next function
      if (index === middlewares.length) {
        return next();
      }

      // Create a next function that executes the next middleware in the chain
      const nextFn = async (): Promise<Response | null> => {
        return executeMiddlewareChain(index + 1);
      };

      // Execute the current middleware with the context and next function
      return await middlewares[index](ctx, nextFn);
    };

    return executeMiddlewareChain(0);
  };
}

/**
 * Applies middleware to an API route handler
 */
export function applyMiddleware<State = AppState>(
  handler: (ctx: MiddlewareContext<State>) => Promise<Response> | Response,
  ...middlewares: Middleware<State>[]
) {
  return async (ctx: MiddlewareContext<State>): Promise<Response> => {
    // Compose all middleware
    const composedMiddleware = composeMiddleware<State>(...middlewares);

    // Execute the middleware chain
    const result = await composedMiddleware(ctx, async () => {
      return await handler(ctx);
    });

    // Return the result or the handler's response
    return result || await handler(ctx);
  };
} 