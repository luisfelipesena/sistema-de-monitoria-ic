'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/common/profile/')({
  component: ProfileComponent,
});

function ProfileComponent() {
  return (
    <PagesLayout title="Meu Perfil">
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Página de perfil do usuário (em construção).
        </p>
      </div>
    </PagesLayout>
  );
}
