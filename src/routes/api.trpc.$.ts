import { createContext } from '@/server/trpc/init';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createConsola } from 'consola';
import { trpcRouter } from '../server/trpc/routers/router';

const logger = createConsola({
  formatOptions: {
    colors: true,
  },
});

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: trpcRouter,
    onError: (opts) => {
      logger.error(opts.error);
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
