import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary';
import { NotFound } from '@/components/NotFound';
import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import SuperJSON from 'superjson';
import { routeTree } from './routeTree.gen';
import { AppRouter } from './trpc/router';

export const trpc = createTRPCReact<AppRouter>();

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    return `http://localhost:3000`;
  })();
  return base + '/api/trpc';
}

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
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: getUrl(),
      }),
    ],
  });
  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient, trpc: serverHelpers },
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
