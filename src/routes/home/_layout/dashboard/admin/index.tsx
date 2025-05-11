import { useAuth } from '@//hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import {
  Eye,
  Hand,
  List,
  Loader,
  Mail,
  Pencil,
  Trash2,
  User,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/dashboard/admin/')({
  component: DashboardAdmin,
});

function DashboardAdmin() {
  // Mock data for dashboard
  const dashboard = [
    {
      id: 1,
      disciplina: 'MATA045',
      status: 'Aprovado',
      bolsistas: 10,
      voluntários: 10,
      inscritos: 8,
    },
    {
      id: 2,
      disciplina: 'MATA045',
      status: 'Negado',
      bolsistas: 0,
      voluntários: 0,
      inscritos: `-`,
    },
    {
      id: 3,
      disciplina: 'MATA045',
      status: 'Em analise',
      bolsistas: '-',
      voluntários: '-',
      inscritos: `-`,
    },
    {
      id: 4,
      disciplina: 'MATA045',
      status: 'Assinatura pendente',
      bolsistas: '-',
      voluntários: `-`,
      inscritos: `-`,
    },
    {
      id: 5,
      disciplina: 'MATA045',
      status: 'Enviado',
      bolsistas: '-',
      voluntários: `-`,
      inscritos: `-`,
    },
    {
      id: 6,
      disciplina: 'MATA045',
      status: 'Fechado',
      bolsistas: 2,
      voluntários: 2,
      inscritos: 1,
    },
  ];

  const tabelaprofessor = [
    {
      id: 1,
      professor: 'Fred Durao',
      status: 'Onboarding feito',
      email: 'fred@gmail.com',
    },

    {
      id: 2,
      professor: 'Fred Durao',
      status: 'Onboarding pendente',
      email: 'fred@gmail.com',
    },

    {
      id: 3,
      professor: 'Fred Durao',
      status: 'Onboarding feito',
      email: 'fred@gmail.com',
    },

    {
      id: 4,
      professor: 'Fred Durao',
      status: 'Onboarding pendente',
      email: 'fred@gmail.com',
    },
  ];

  const tabelaaluno = [
    {
      id: 1,
      aluno: 'Murilo Almeida',
      status: 'Onboarding feito',
      email: 'fred@gmail.com',
    },

    {
      id: 2,
      aluno: 'Murilo Almeida',
      status: 'Onboarding pendente',
      email: 'fred@gmail.com',
    },

    {
      id: 3,
      aluno: 'Murilo Almeida',
      status: 'Onboarding feito',
      email: 'fred@gmail.com',
    },

    {
      id: 4,
      aluno: 'Murilo Almeida',
      status: 'Onboarding pendente',
      email: 'fred@gmail.com',
    },
  ];

  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<
    'projetos' | 'estatisticas' | 'professores' | 'alunos'
  >('projetos');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome message */}
      <h1 className="text-5xl font-bold mb-8">
        Olá, {user?.username || 'Usuário'}!
      </h1>

      {/* Tabela padronizada */}

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-normal">Seu Dashboard</h2>

        <div className="flex gap-4">
          <Button
            variant="primary"
            className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
          >
            {abaAtiva === 'projetos'
              ? 'Agrupar Submissões'
              : abaAtiva === 'professores'
                ? 'Adicionar Professor'
                : abaAtiva === 'alunos'
                  ? 'Adicionar Aluno'
                  : ''}
          </Button>
          <Button variant="disabled" className="text-gray-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6h18M6 16h12"
              />
            </svg>
            Filtros
          </Button>
        </div>
      </div>
      <div className="mb-6 flex gap-6 border-b border-gray-200">
        {[
          { id: 'projetos', label: 'Projetos' },
          { id: 'estatisticas', label: 'Estatísticas' },
          { id: 'professores', label: 'Professores' },
          { id: 'alunos', label: 'Alunos' },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={`py-2 px-1 text-base font-medium border-b-2 transition-colors ${
              abaAtiva === aba.id
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* CONTEUDO DA ABA PROJETOS*/}
      {abaAtiva === 'projetos' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <List className="h-5 w-5 text-gray-400" />
                    Componente curricular
                  </div>
                </th>
                <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Loader className="h-5 w-5 text-gray-400" />
                    Status
                  </div>
                </th>
                <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    Bolsistas
                  </div>
                </th>
                <th className="h-14 px-4 text-center font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <Hand className="h-5 w-5 text-gray-400" />
                    Voluntários
                  </div>
                </th>
                <th className="h-14 px-4 text-center font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    Inscritos
                  </div>
                </th>
                <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-400" />
                    Ações
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboard.map((dashboard) => (
                <tr
                  key={dashboard.id}
                  className={
                    dashboard.status === 'Fechado'
                      ? `text-gray-400`
                      : 'border-b last:border-0 hover:bg-gray-50 transition-colors'
                  }
                >
                  <td className="p-4 align-middle font-semibold text-base text-gray-900">
                    {dashboard.disciplina}
                  </td>
                  <td className="p-4 align-middle text-base">
                    {dashboard.status === 'Aprovado' ? (
                      <Badge variant="success">Aprovado</Badge>
                    ) : dashboard.status === 'Negado' ? (
                      <Badge variant="destructive">Negado</Badge>
                    ) : dashboard.status === 'Fechado' ? (
                      <Badge variant="outline">Fechado</Badge>
                    ) : dashboard.status === `Assinatura pendente` ? (
                      <Badge variant="warning">Assinatura pendente</Badge>
                    ) : dashboard.status === 'Em analise' ? (
                      <Badge variant="warning">Em analise</Badge>
                    ) : (
                      <Badge variant="muted">Enviado</Badge>
                    )}
                  </td>
                  <td className="p-4 align-middle">{dashboard.bolsistas}</td>
                  <td className="p-4 align-middle text-center">
                    {dashboard.voluntários}
                  </td>
                  <td className="p-4 align-middle text-center text-base">
                    {dashboard.inscritos}
                  </td>
                  <td className="p-4 align-middle">
                    <Button
                      variant="primary"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Analisar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA COM ESTATISTICAS (EM BRANCO)*/}
      {abaAtiva === 'estatisticas' && (
        <div className="text-gray-600 text-base mt-4">
          Estatísticas virão aqui.
        </div>
      )}
      {/* ABA COM TABELA PROFESSORES*/}
      {abaAtiva === 'professores' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="text-gray-600 text-base mt-4">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      Nome do Professor
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Loader className="h-5 w-5 text-gray-400" />
                      Status
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      Email
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                      Ações
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tabelaprofessor.map((tabelaprofessor) => (
                  <tr
                    key={tabelaprofessor.id}
                    className={
                      tabelaprofessor.status === 'Fechado'
                        ? `text-gray-400`
                        : 'border-b last:border-0 hover:bg-gray-50 transition-colors'
                    }
                  >
                    <td className="p-4 align-middle font-semibold text-base text-gray-900">
                      {tabelaprofessor.professor}
                    </td>
                    <td className="p-4 align-middle text-base">
                      {tabelaprofessor.status === 'Onboarding feito' ? (
                        <Badge variant="retaVerde">Onboarding feito</Badge>
                      ) : tabelaprofessor.status === 'Onboarding pendente' ? (
                        <Badge variant="retaVermelha">
                          Onboarding pendente
                        </Badge>
                      ) : (
                        <Badge variant="muted">Enviado</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {tabelaprofessor.email}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ABA COM TABELA ALUNOS*/}
      {abaAtiva === 'alunos' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="text-gray-600 text-base mt-4">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      Nome do Aluno
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Loader className="h-5 w-5 text-gray-400" />
                      Status
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      Email
                    </div>
                  </th>
                  <th className="h-14 px-4 text-left font-bold text-lg text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                      Ações
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tabelaaluno.map((tabelaaluno) => (
                  <tr
                    key={tabelaaluno.id}
                    className={
                      tabelaaluno.status === 'Fechado'
                        ? `text-gray-400`
                        : 'border-b last:border-0 hover:bg-gray-50 transition-colors'
                    }
                  >
                    <td className="p-4 align-middle font-semibold text-base text-gray-900">
                      {tabelaaluno.aluno}
                    </td>
                    <td className="p-4 align-middle text-base">
                      {tabelaaluno.status === 'Onboarding feito' ? (
                        <Badge variant="retaVerde">Onboarding feito</Badge>
                      ) : tabelaaluno.status === 'Onboarding pendente' ? (
                        <Badge variant="retaVermelha">
                          Onboarding pendente
                        </Badge>
                      ) : (
                        <Badge variant="muted">Enviado</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle">{tabelaaluno.email}</td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;
