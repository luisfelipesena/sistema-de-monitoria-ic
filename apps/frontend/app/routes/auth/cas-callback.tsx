'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

export default function CasCallbackPage() {
  const navigate = useNavigate();
  const { refetchUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const result = await refetchUser();
        setTimeout(() => {
          if (result.data && result.status === 'success') {
            navigate('/home');
          } else {
            setError(
              'Falha na autenticação. Seu login não pôde ser completado.',
            );
          }
        }, 500);
      } catch (err: any) {
        console.error('Error processing CAS callback:', err);
        setError(err.message || 'Erro ao processar autenticação UFBA');
      }
    }

    handleAuth();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Autenticação UFBA</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <p>Processando autenticação...</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Você será redirecionado automaticamente.
              </p>
            </div>
          ) : error ? (
            <div className="py-4">
              <p className="mb-4 font-medium text-destructive">{error}</p>
              <Button>
                <Link to="/">Ir para a página inicial</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
