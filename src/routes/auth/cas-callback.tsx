'use client';

// import { Button } from '@/components/ui/button'; // Assuming shadcn setup - Temporarily commented out
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming shadcn setup - Temporarily commented out
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

// export const Route = createFileRoute('/auth/cas-callback')({ // TEMPORARY PATH - NEEDS FIXING
export const Route = createFileRoute('/auth/cas-callback')({
  // TEMPORARY PATH - NEEDS FIXING -> FIXED
  component: CasCallbackPage,
});

function CasCallbackPage() {
  const navigate = useNavigate();
  const { refetchUser, isLoading: isAuthLoading } = useAuth(); // Renamed isLoading to avoid conflict
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log('cas-callback.tsx: Component mounted');

    async function handleAuth() {
      console.log('cas-callback.tsx: Calling refetchUser');
      try {
        const result = await refetchUser();
        console.log('cas-callback.tsx: refetchUser result:', result);

        // Short delay to allow state updates and avoid flickering
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMounted) return;

        // Access user data directly from the result if needed, or rely on AuthProvider update
        if (result.data?.user && result.status === 'success') {
          // console.log('cas-callback.tsx: Auth success, navigating to /'); // TEMPORARY PATH
          console.log('cas-callback.tsx: Auth success, navigating to /home');
          // navigate({ to: '/', replace: true }); // Use / route - TEMPORARY PATH
          navigate({ to: '/home', replace: true }); // Use /home route - FIXED
        } else {
          console.log('cas-callback.tsx: Auth failed, setting error');
          setError(
            result.error?.message ||
              'Falha na autenticação. Seu login não pôde ser completado.',
          );
          setIsProcessing(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('cas-callback.tsx: Error processing CAS callback:', err);
        setError(err.message || 'Erro ao processar autenticação UFBA');
        setIsProcessing(false);
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
      console.log('cas-callback.tsx: Component unmounted');
    };
  }, [navigate, refetchUser]);

  // Combine auth loading state with processing state
  const isLoading = isAuthLoading || isProcessing;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      {/* <Card className="w-full max-w-md"> // Temporarily commented out */}
      <div className="w-full max-w-md p-4 border rounded shadow">
        {/* <CardHeader> // Temporarily commented out */}
        <div>
          {/* <CardTitle className="text-2xl">Autenticação UFBA</CardTitle> // Temporarily commented out */}
          <h1 className="text-2xl font-bold">Autenticação UFBA</h1>
          {/* </CardHeader> // Temporarily commented out */}
        </div>
        {/* <CardContent> // Temporarily commented out */}
        <div>
          {isLoading ? (
            <div className="py-8 text-center">
              <p>Processando autenticação...</p>
              {/* Optional: Add a spinner here */}
              <p className="mt-2 text-sm text-muted-foreground">
                Você será redirecionado automaticamente.
              </p>
            </div>
          ) : error ? (
            <div className="py-4">
              <p className="mb-4 font-medium text-destructive">{error}</p>
              {/* <Button asChild> // Temporarily commented out */}
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Ir para a página inicial
              </Link>
              {/* </Button> // Temporarily commented out */}
            </div>
          ) : (
            // Optional: Show a success message briefly before redirect?
            <div className="py-8 text-center">
              <p>Autenticação bem-sucedida! Redirecionando...</p>
            </div>
          )}
          {/* </CardContent> // Temporarily commented out */}
        </div>
        {/* </Card> // Temporarily commented out */}
      </div>
    </div>
  );
}
