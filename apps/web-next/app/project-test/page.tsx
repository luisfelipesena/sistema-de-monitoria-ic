'use client';

import { InteractiveProjectPDF } from '@/components/features/projects/InteractiveProjectPDF';
import type { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectTestPage() {
  const [userRole, setUserRole] = useState<'professor' | 'admin'>('professor');

  const mockFormData: MonitoriaFormData = {
    titulo: 'Projeto de Monitoria - Introdução à Ciência da Computação',
    descricao: 'Este projeto visa auxiliar estudantes na disciplina de Introdução à Ciência da Computação, proporcionando suporte extra-classe e orientação prática em programação.',
    departamento: {
      id: 1,
      nome: 'Departamento de Ciência da Computação'
    },
    coordenadorResponsavel: 'Dr. João Silva',
    professorResponsavel: {
      id: 1,
      nomeCompleto: 'Maria Santos Oliveira',
      nomeSocial: undefined,
      genero: 'FEMININO' as const,
      cpf: '123.456.789-10',
      matriculaSiape: '1234567',
      regime: 'DE' as const,
      telefone: '(71) 99999-9999',
      telefoneInstitucional: '(71) 3283-7654',
      emailInstitucional: 'maria.santos@ufba.br'
    },
    ano: 2025,
    semestre: 'SEMESTRE_1' as const,
    tipoProposicao: 'INDIVIDUAL' as const,
    bolsasSolicitadas: 2,
    voluntariosSolicitados: 1,
    cargaHorariaSemana: 12,
    numeroSemanas: 16,
    publicoAlvo: 'Estudantes de graduação em Ciência da Computação',
    estimativaPessoasBenificiadas: 60,
    disciplinas: [
      {
        id: 1,
        codigo: 'MATA02',
        nome: 'Introdução à Ciência da Computação'
      },
      {
        id: 2,
        codigo: 'MATA37',
        nome: 'Introdução à Lógica de Programação'
      }
    ],
    user: {
      username: 'maria.santos',
      email: 'maria.santos@ufba.br',
      nomeCompleto: 'Maria Santos Oliveira',
      role: userRole
    },
    projetoId: 1
  };

  const handleSignatureComplete = () => {
    console.log('Assinatura completada!');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Teste de Assinatura de Projeto</h1>
          <p className="text-muted-foreground">
            Página para testar o fluxo de assinatura digital de projetos com tRPC.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={userRole === 'professor' ? undefined : 'outline'}
                onClick={() => setUserRole('professor')}
              >
                Testar como Professor
              </Button>
              <Button
                variant={userRole === 'admin' ? undefined : 'outline'}
                onClick={() => setUserRole('admin')}
              >
                Testar como Admin
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <InteractiveProjectPDF
          formData={mockFormData}
          userRole={userRole}
          onSignatureComplete={handleSignatureComplete}
        />
      </div>
    </div>
  );
}