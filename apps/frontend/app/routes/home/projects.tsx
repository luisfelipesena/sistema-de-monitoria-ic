'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function Projects() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Projetos</h1>

          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Projetos de Monitoria
            </h2>
            <p className="mb-4 text-gray-600">
              Aqui você pode gerenciar os seus projetos de monitoria.
            </p>

            <div className="p-4 mt-4 rounded bg-gray-50">
              <p className="text-center text-gray-500">
                Nenhum projeto encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
