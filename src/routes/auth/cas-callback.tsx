'use client';

import { Spinner } from '@/components/ui/spinner';
import { trpc } from '@/server/trpc/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/auth/cas-callback')({
  component: CasCallbackPage,
});

function CasCallbackPage() {
  const navigate = useNavigate();
  const mutation = trpc.auth.casCallback.useMutation();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('ticket');
    if (ticket) {
      called.current = true;
      mutation.mutate(
        { ticket },
        {
          onSuccess: () => navigate({ to: '/home', replace: true }),
          onError: () =>
            setError('Falha na autenticação CAS. Tente novamente.'),
        },
      );
    } else {
      setError('Ticket não encontrado na URL.');
    }
  }, [mutation, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md p-4 border rounded shadow">
          <h1 className="text-2xl font-bold">Erro de autenticação</h1>
          <div className="py-8 text-center text-red-600">{error}</div>
          <button
            onClick={() => navigate({ to: '/', replace: true })}
            className="btn"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-4 border rounded shadow">
        <h1 className="text-2xl font-bold">Autenticação UFBA</h1>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Spinner />
          <p className="mt-2 text-sm text-muted-foreground">
            Você será redirecionado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
