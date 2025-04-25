'use client';

import { createFileRoute } from '@tanstack/react-router';

// export const Route = createFileRoute('/home/projects')({ // TEMPORARY PATH - NEEDS FIXING
export const Route = createFileRoute('/home/projects')({
  // FIXED
  component: ProjectsComponent,
});

function ProjectsComponent() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Gerenciar Projetos
      </h1>
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Página de gerenciamento de projetos (em construção).
        </p>
        {/* TODO: Add project listing, creation, editing based on user role */}
      </div>
    </div>
  );
}
