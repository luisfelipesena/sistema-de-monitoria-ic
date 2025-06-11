'use client';

import { UserSignatureManager } from '@/components/features/profile/UserSignatureManager';

export default function ProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Perfil do Usuário</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e assinatura digital.
          </p>
        </div>
        
        <UserSignatureManager />
      </div>
    </div>
  );
}