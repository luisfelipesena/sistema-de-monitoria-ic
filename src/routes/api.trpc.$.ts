import { createContext } from '@/server/trpc/init';
import { logger } from '@/utils/logger';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '../server/trpc/routers/router';

const log = logger.child({
  module: 'api.trpc.$ wrapper',
});

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: trpcRouter,
    onError: (opts) => {
      log.error({ error: opts.error, message: opts.error.message }, 'TRPC Error');
    },
    createContext: async (opts) => {
      return createContext(opts.req, opts.resHeaders);
    },
  });
}

export const APIRoute = createAPIFileRoute('/api/trpc/$')({
  GET: handler,
  POST: handler,
});
