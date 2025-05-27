'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

export const Route = createFileRoute('/auth/cas-callback')({
  component: CasCallbackPage,
});

function CasCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();

  const handleRedirect = useCallback(async () => {
    if (!user) {
      navigate({ to: '/', replace: true });
      return;
    }

    // navigate({ to: '/home', replace: true });
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      handleRedirect();
    }
  }, [isLoading]);

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
