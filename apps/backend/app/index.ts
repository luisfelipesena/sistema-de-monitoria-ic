import { Hono, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';
import { env } from './config/env';
import { AppError } from './error';
import logger from './lib/logger';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './modules/auth/routes';
import type { AppEnv } from './types';

// --- API Routes ---

export const app = (depsMiddleware: MiddlewareHandler<AppEnv>) =>
  new Hono<AppEnv>()
    .use(depsMiddleware)
    .use('*', poweredBy())
    .use('*', honoLogger())
    .use('*', cors({ origin: env.CLIENT_URL, credentials: true }))
    .use('*', prettyJSON())
    .use('*', authMiddleware)
    .route('/auth', authRoutes)
    .notFound((c) => {
      return c.json({ message: 'Not Found', ok: false }, 404);
    })
    .onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ message: err.message }, err.status);
      }
      logger.error({ err }, `Server Error: ${err}`);
      return c.json({ message: err.message || 'Internal Server Error' }, 500);
    });

export type AppType = ReturnType<typeof app>;
