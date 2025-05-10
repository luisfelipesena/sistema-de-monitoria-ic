'use client';

import { Spinner } from '@/components/ui/spinner';
import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { LUCIA_SESSION_COOKIE_NAME } from '@/utils/types';
import { createFileRoute, redirect } from '@tanstack/react-router';
import Cookie from 'js-cookie';
import { useEffect } from 'react';
import { z } from 'zod';
const log = logger.child({ context: 'LoginPage' });

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
  validateSearch: z.object({
    ticket: z.string(),
  }),
  loaderDeps: ({ search }) => ({ ticket: search.ticket }),
  loader: async ({ context, deps }) => {
    try {
      try {
        const result = await context.trpc.auth.me.query();
        return { user: result };
      } catch (error) {
        log.warn({ error }, 'User not found, continuing...');
      }

      const ticket = deps.ticket;
      if (!ticket) {
        throw redirect({ to: '/' });
      }

      const serviceUrl = `${env.CLIENT_URL}/auth/login`;
      const validationUrl = `${env.CAS_SERVER_URL_PREFIX}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceUrl)}`;
      const response = await fetch(validationUrl);
      const responseData = await response.text();
      const result = await context.trpc.auth.loginCallback.mutate({
        responseData,
      });

      return {
        sessionCookie: result.sessionCookie,
      };
    } catch (error) {
      throw redirect({ to: '/' });
    }
  },
  errorComponent: () => {
    return <div>Erro ao autenticar</div>;
  },
  pendingComponent: () => {
    return <Spinner />;
  },
});

function LoginPage() {
  const { sessionCookie, user } = Route.useLoaderData();

  useEffect(() => {
    if (sessionCookie) {
      Cookie.set(LUCIA_SESSION_COOKIE_NAME, sessionCookie.value);
    }

    if (user || sessionCookie) {
      window.location.href = '/home';
    }
  }, [sessionCookie, user]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-4 border rounded shadow">
        <div>
          <h1 className="text-2xl font-bold">Autenticação UFBA</h1>
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
