"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { trpc, getTrpcClient } from '../src/utils/trpc';

const queryClient = new QueryClient();
const trpcClient = getTrpcClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}