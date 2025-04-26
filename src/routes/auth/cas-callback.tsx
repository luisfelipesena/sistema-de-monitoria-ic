'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/auth/cas-callback')({
  component: CasCallbackPage,
});

function CasCallbackPage() {
  const navigate = useNavigate();
  const { refetchUser, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const result = await refetchUser();
        if (!isMounted) return;
        if (result.status === 'success') {
          navigate({ to: '/home', replace: true });
        } else {
          setError(
            result.error?.message ||
              'Falha na autenticação. Seu login não pôde ser completado.',
          );
          setIsProcessing(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Erro ao processar autenticação UFBA');
        setIsProcessing(false);
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, refetchUser]);

  const isLoading = isAuthLoading || isProcessing;

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
          ) : error ? (
            <div className="py-4">
              <p className="mb-4 font-medium text-destructive">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Ir para a página inicial
              </Link>
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
