import { type QueryClient } from '@tanstack/react-query';
import { type TRPCClient } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { type ReactNode } from 'react';
import { type AppRouter } from './router';

export const trpc = createTRPCReact<AppRouter>();

export const TRPCProvider = ({
  children,
  trpcClient,
  queryClient,
}: {
  children: ReactNode;
  trpcClient: TRPCClient<AppRouter>;
  queryClient: QueryClient;
}) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
};

export const useTRPC = trpc.useContext;
