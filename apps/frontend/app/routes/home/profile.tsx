'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 ml-64">
        <main className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Perfil</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-12 h-12 text-white bg-blue-500 rounded-full">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user?.email?.split('@')[0]}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          Email
                        </div>
                        <div>{user?.email}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          ID
                        </div>
                        <div>{user?.id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">
                  Gerencie suas preferências do sistema aqui.
                </p>
                <Button className="mt-4" disabled>
                  Atualizar Preferências
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
