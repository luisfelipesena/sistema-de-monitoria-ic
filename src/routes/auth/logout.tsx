'use client';

import { Spinner } from '@/components/ui/spinner';
import { createFileRoute } from '@tanstack/react-router';
import { deleteCookie } from '@tanstack/react-start/server';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/logout')({
  component: LogoutPage,
  loader: async ({ context }) => {
    await context.trpc.auth.logout.mutate();
    deleteCookie('session');
    return { success: true };
  },
});

function LogoutPage() {
  const { success } = Route.useLoaderData();

  useEffect(() => {
    if (success) {
      window.location.href = '/';
    }
  }, [success]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-4 border rounded shadow">
        <div>
          <h1 className="text-2xl font-bold">Deslogando...</h1>
        </div>
        <div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Spinner />
            <p className="mt-2 text-sm text-muted-foreground">
              Você será redirecionado automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
