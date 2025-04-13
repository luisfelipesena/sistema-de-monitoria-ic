import { serve } from '@hono/node-server';
import { createMiddleware } from 'hono/factory';
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

serve({ fetch: app(injectDependencies).fetch, port: 3000 });
logger.info(' ✅ Server started on port 3000');
