import { Hono, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';
import { AppError } from './error';
import { authMiddleware } from './middleware/auth';
import { casRoutes } from './modules/auth/routes';
import type { AppEnv } from './types';

// --- API Routes ---

export const app = (depsMiddleware: MiddlewareHandler<AppEnv>) =>
  new Hono<AppEnv>()
    .use(depsMiddleware)
    .use('*', poweredBy())
    .use('*', logger())
    .use('*', cors())
    .use('*', prettyJSON())
    .use('*', authMiddleware)
    .route('/auth', casRoutes)
    .notFound((c) => {
      return c.json({ message: 'Not Found', ok: false }, 404);
    })
    .onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ message: err.message }, err.status);
      }
      console.error(`Server Error: ${err}`);
      return c.json({ message: err.message || 'Internal Server Error' }, 500);
    });

export type AppType = ReturnType<typeof app>;
