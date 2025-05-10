import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary';
import { NotFound } from '@/components/NotFound';

import { trpc } from '@/server/trpc/react';
import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getHeaders } from '@tanstack/react-start/server';
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from '@trpc/client';
import SuperJSON from 'superjson';
import { routeTree } from './routeTree.gen';
import { AppRouter } from './server/trpc/routers/router';

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    return `http://localhost:3000`;
  })();
  return base + '/api/trpc';
}

const headers = createIsomorphicFn()
  .client(() => ({}))
  .server(() => getHeaders());

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        experimental_prefetchInRender: true,
      },
    },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (opts) => {
          return (
            (opts.direction === 'down' && opts.result instanceof Error) ||
            opts.direction === 'up'
          );
        },
      }),
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: getUrl(),
        headers,
      }),
    ],
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient, trpc: trpcClient },
      defaultPreload: 'render',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      Wrap: (props) => {
        return (
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            {props.children}
          </trpc.Provider>
        );
      },
    }),
    queryClient,
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
