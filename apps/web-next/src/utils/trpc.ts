import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '../server/routers/_app';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({ url: '/api/trpc' }),
    ],
  });
}