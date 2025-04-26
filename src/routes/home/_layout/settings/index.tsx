'use client';

import { createFileRoute } from '@tanstack/react-router';

// export const Route = createFileRoute('/home/_layout/settings/')({ // TEMPORARY PATH - NEEDS FIXING
export const Route = createFileRoute('/home/_layout/settings/')({
  // FIXED
  component: SettingsComponent,
});

function SettingsComponent() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Configurações</h1>
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Página de configurações (em construção).
        </p>
        {/* TODO: Add user settings options */}
      </div>
    </div>
  );
}
