'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
const log = logger.child({ context: 'CasCallbackPage' });

export const Route = createFileRoute('/auth/cas-callback')({
  component: CasCallbackPage,
  validateSearch: z.object({
    ticket: z.string(),
  }),
  loaderDeps: ({ search }) => ({ ticket: search.ticket }),
  loader: async ({ context, deps }) => {
    try {
      const { trpc } = context;
      try {
        const user = await trpc.auth.me.query();
        if (user) {
          return redirect({ to: '/home' });
        }
      } catch (error) {
        log.warn({ error }, 'User not found, continuing...');
      }

      const ticket = deps.ticket;
      if (!ticket) {
        return redirect({ to: '/' });
      }

      const serviceUrl = `${env.CLIENT_URL}/auth/cas-callback`;
      const validationUrl = `${env.CAS_SERVER_URL_PREFIX}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;
      const response = await fetch(validationUrl);
      const responseData = await response.text();
      const result = await trpc.auth.casCallback.mutate({ responseData });
      return {
        success: result.success,
        sessionCookie: result.sessionCookie,
      };
    } catch (error) {
      log.error(error);
      return redirect({ to: '/' });
    }
  },
});

function CasCallbackPage() {
  const { isLoading } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-4 border rounded shadow">
        <div>
          <h1 className="text-2xl font-bold">Autenticação UFBA</h1>
        </div>
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Spinner />
              <p className="mt-2 text-sm text-muted-foreground">
                Você será redirecionado automaticamente.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p>Autenticação bem-sucedida! Redirecionando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
