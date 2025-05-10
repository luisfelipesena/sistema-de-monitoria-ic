import { createContext } from '@/server/trpc/init';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '../server/trpc/routers/router';

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: trpcRouter,
    createContext: async (opts) => {
      return createContext(opts.req, opts.resHeaders);
    },
  });
}

export const APIRoute = createAPIFileRoute('/api/trpc/$')({
  GET: handler,
  POST: handler,
});
