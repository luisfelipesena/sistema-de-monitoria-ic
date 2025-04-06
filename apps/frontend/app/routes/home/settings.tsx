'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            Configurações
          </h1>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como você deseja receber notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">
                        Notificações por email
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receba atualizações sobre seus projetos por email
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deadline-reminders">
                        Lembretes de prazos
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receba lembretes sobre prazos próximos
                      </p>
                    </div>
                    <Switch id="deadline-reminders" defaultChecked />
                  </div>
                </div>

                <Button className="mt-6">Salvar preferências</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie as configurações de segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline">Alterar senha</Button>
                  <Button variant="outline">
                    Ativar autenticação de dois fatores
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
