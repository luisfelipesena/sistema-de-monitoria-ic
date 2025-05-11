import { useAuth } from '@/hooks/use-auth';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import { logger } from '@/utils/logger';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ProfessorForm } from './-components/professor-form';
import { StudentForm } from './-components/student-form';

const log = logger.child({
  context: 'onboarding',
});

export const Route = createFileRoute('/home/_layout/common/onboarding/')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário precisa de onboarding usando nosso novo hook
  const { data: onboardingStatus, isLoading: statusLoading } =
    useOnboardingStatus();

  // Quando o status estiver disponível, redirecionar se não for necessário onboarding
  useEffect(() => {
    if (!authLoading && !statusLoading && onboardingStatus) {
      if (!onboardingStatus.pending) {
        navigate({ to: '/home' });
      }
    }
  }, [onboardingStatus, authLoading, statusLoading, navigate]);

  if (authLoading || statusLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  // Se não precisar de onboarding, não renderizar nada (será redirecionado)
  if (!onboardingStatus?.pending) {
    return null;
  }

  // Admin não precisa de onboarding
  if (user?.role === 'admin') {
    navigate({ to: '/home' });
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Seja bem-vindo(a)!</h1>
      <p className="mb-8 text-muted-foreground">Cadastre suas informações</p>

      {user?.role === 'student' ? <StudentForm /> : <ProfessorForm />}
    </div>
  );
}
