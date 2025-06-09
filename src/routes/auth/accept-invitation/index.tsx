import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAcceptInvitation, useValidateInvitation } from '@/hooks/use-invitation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircle, CheckCircle, UserCheck, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

type SearchParams = {
  token?: string;
};

export const Route = createFileRoute('/auth/accept-invitation/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      token: typeof search.token === 'string' ? search.token : undefined,
    };
  },
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [processingInvitation, setProcessingInvitation] = useState(false);

  const {
    data: validationResult,
    isLoading: validationLoading,
    error: validationError,
  } = useValidateInvitation(token || '');

  const acceptInvitationMutation = useAcceptInvitation();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user && token) {
      // Redirecionar para CAS login preservando o token
      const casLoginUrl = `/api/auth/cas-login?redirect=${encodeURIComponent(
        `/auth/accept-invitation?token=${token}`
      )}`;
      window.location.href = casLoginUrl;
    }
  }, [authLoading, user, token]);

  // Processar convite automaticamente se estiver autenticado e token válido
  useEffect(() => {
    if (
      user &&
      validationResult?.valid &&
      !processingInvitation &&
      !acceptInvitationMutation.data
    ) {
      setProcessingInvitation(true);
      acceptInvitationMutation.mutate(token!, {
        onSuccess: (response) => {
          if (response.success) {
            toast({
              title: 'Convite aceito!',
              description: 'Você agora é um professor. Complete seu cadastro.',
            });
            
            // Redirecionar para onboarding após pequeno delay
            setTimeout(() => {
              navigate({ to: '/home/common/onboarding' });
            }, 2000);
          } else {
            toast({
              title: 'Erro ao aceitar convite',
              description: response.message,
              variant: 'destructive',
            });
          }
        },
        onError: (error) => {
          toast({
            title: 'Erro ao processar convite',
            description: error.message,
            variant: 'destructive',
          });
          setProcessingInvitation(false);
        },
      });
    }
  }, [user, validationResult, token, processingInvitation, acceptInvitationMutation, toast, navigate]);

  // Estados de carregamento
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Token Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              O link de convite não contém um token válido.
            </p>
            <Button onClick={() => navigate({ to: '/home' })}>
              Ir para página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || validationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 mb-4">
              <Spinner />
            </div>
            <p className="text-muted-foreground">
              {authLoading ? 'Verificando autenticação...' : 'Validando convite...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erro de validação ou token inválido
  if (validationError || !validationResult?.valid) {
    const message = validationResult?.message || 'Erro ao validar convite';
    const isExpired = validationResult?.expired;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              {isExpired ? 'Convite Expirado' : 'Convite Inválido'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{message}</p>
            <Button onClick={() => navigate({ to: '/home' })}>
              Ir para página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convite processado com sucesso
  if (acceptInvitationMutation.data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Convite Aceito!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Você agora é um professor! Redirecionando para completar seu cadastro...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4">
                <Spinner />
              </div>
              <span className="text-sm text-muted-foreground">Redirecionando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processando convite
  if (processingInvitation || acceptInvitationMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserCheck className="h-6 w-6" />
              Processando Convite
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8">
                <Spinner />
              </div>
              <div>
                <p className="font-medium">Aceitando convite para professor</p>
                <p className="text-sm text-muted-foreground">
                  Email: {validationResult.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado inicial - mostrar informações do convite
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserCheck className="h-6 w-6" />
            Convite para Professor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <div>
              <p className="font-medium">Você foi convidado para ser professor!</p>
              <p className="text-sm text-muted-foreground">
                Email: {validationResult.email}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Faça login para aceitar o convite</span>
            </div>

            <Button 
              onClick={() => {
                const casLoginUrl = `/api/auth/cas-login?redirect=${encodeURIComponent(
                  `/auth/accept-invitation?token=${token}`
                )}`;
                window.location.href = casLoginUrl;
              }}
              className="w-full"
            >
              Fazer Login e Aceitar Convite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 