'use client';

import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 ml-64">
        <main className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Bem-vindo, {user?.email?.split('@')[0]}
              </h2>
              <p className="text-gray-600">
                Este é seu dashboard para gerenciar atividades de monitoria. Use
                o menu lateral para navegar pelo sistema.
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Seus Projetos
              </h2>
              <div className="flex items-center justify-center p-4 text-gray-500 bg-gray-100 rounded">
                <p>Nenhum projeto ativo no momento</p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Notificações
              </h2>
              <div className="flex items-center justify-center p-4 text-gray-500 bg-gray-100 rounded">
                <p>Nenhuma notificação nova</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
