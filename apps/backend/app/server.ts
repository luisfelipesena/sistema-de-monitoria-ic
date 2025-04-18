import { serve } from '@hono/node-server';
import { createMiddleware } from 'hono/factory';
import { env } from './config/env';
import { db } from './database';
import { app } from './index';
import logger from './lib/logger';
import type { AppEnv } from './types';

const injectDependencies = createMiddleware<AppEnv>(async (c, next) => {
  c.set('db', db);
  c.set('user', null);
  c.set('session', null);
  await next();
});

const PORT = env.PORT;
serve({ fetch: app(injectDependencies).fetch, port: PORT });
logger.info(` ✅ Server started on port ${PORT}`);
