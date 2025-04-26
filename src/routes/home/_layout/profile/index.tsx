'use client';

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/profile/')({
  component: ProfileComponent,
});

function ProfileComponent() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Meu Perfil</h1>
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Página de perfil do usuário (em construção).
        </p>
      </div>
    </div>
  );
}
