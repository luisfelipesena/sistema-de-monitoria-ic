'use client';

import { useAuth } from '@//hooks/use-auth';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/home/_layout/')({
  component: HomeComponent,
});

function HomeComponent() {
  const { user } = useAuth();
  const { isComplete, isLoading } = useProfileCompleteness();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      (user.role === 'student' || user.role === 'professor') &&
      !isComplete
    ) {
      navigate({ to: '/onboarding' });
    }
  }, [isLoading, isComplete, user, navigate]);

  if (isLoading) return null;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Visão Geral</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Welcome Card */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Bem-vindo, {user?.username || 'Usuário'}!
          </h2>
          <p className="text-gray-600">
            Utilize o menu lateral para navegar entre as funcionalidades do
            sistema de monitoria.
          </p>
        </div>

        {/* Projects Summary Card (Placeholder) */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Meus Projetos
          </h2>
          <div className="flex items-center justify-center p-4 text-gray-500 bg-gray-100 rounded">
            {/* TODO: Fetch and display user's project summary */}
            <p>Nenhum projeto ativo no momento.</p>
          </div>
        </div>

        {/* Notifications Card (Placeholder) */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Notificações
          </h2>
          <div className="flex items-center justify-center p-4 text-gray-500 bg-gray-100 rounded">
            {/* TODO: Fetch and display notifications */}
            <p>Nenhuma notificação nova.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
