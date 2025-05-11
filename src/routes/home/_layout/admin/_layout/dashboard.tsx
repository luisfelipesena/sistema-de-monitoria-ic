import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
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

export const Route = createFileRoute('/home/_layout/admin/_layout/dashboard')({
  component: DashboardAdmin,
});

// Define types for our data
interface ProjectData {
  id: number;
  disciplina: string;
  status: string;
  bolsistas: number | string;
  voluntários: number | string;
  inscritos: number | string;
}

interface ProfessorData {
  id: number;
  professor: string;
  status: string;
  email: string;
}

interface AlunoData {
  id: number;
  aluno: string;
  status: string;
  email: string;
}

function DashboardAdmin() {
  // Mock data for dashboard
  const dashboard: ProjectData[] = [
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

  const tabelaprofessor: ProfessorData[] = [
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

  const tabelaaluno: AlunoData[] = [
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

  const [abaAtiva, setAbaAtiva] = useState<
    'projetos' | 'estatisticas' | 'professores' | 'alunos'
  >('projetos');

  // Column definitions for different tabs
  const colunasProjetos: ColumnDef<ProjectData>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: 'disciplina',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.disciplina}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'Aprovado') {
          return <Badge variant="success">Aprovado</Badge>;
        } else if (status === 'Negado') {
          return <Badge variant="destructive">Negado</Badge>;
        } else if (status === 'Fechado') {
          return <Badge variant="outline">Fechado</Badge>;
        } else if (status === 'Assinatura pendente') {
          return <Badge variant="warning">Assinatura pendente</Badge>;
        } else if (status === 'Em analise') {
          return <Badge variant="warning">Em analise</Badge>;
        } else {
          return <Badge variant="muted">Enviado</Badge>;
        }
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsistas
        </div>
      ),
      accessorKey: 'bolsistas',
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: 'voluntários',
      cell: ({ row }) => (
        <div className="text-center">{row.original.voluntários}</div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: 'inscritos',
      cell: ({ row }) => (
        <div className="text-center text-base">{row.original.inscritos}</div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: () => (
        <Button
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Analisar
        </Button>
      ),
    },
  ];

  const colunasProfessores: ColumnDef<ProfessorData>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Professor
        </div>
      ),
      accessorKey: 'professor',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.professor}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'Onboarding feito') {
          return <Badge variant="success">Onboarding feito</Badge>;
        } else {
          return <Badge variant="destructive">Onboarding pendente</Badge>;
        }
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: () => (
        <div className="flex gap-2 ml-auto w-full">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  const colunasAlunos: ColumnDef<AlunoData>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Aluno
        </div>
      ),
      accessorKey: 'aluno',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.aluno}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'Onboarding feito') {
          return <Badge variant="success">Onboarding feito</Badge>;
        } else {
          return <Badge variant="destructive">Onboarding pendente</Badge>;
        }
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: () => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  // Action buttons
  const dashboardActions = (
    <>
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
              : abaAtiva === 'estatisticas'
                ? 'Baixar Estatísticas'
                : ''}
      </Button>
      <Button variant="outline" className="text-gray-600">
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
    </>
  );

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
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
        <TableComponent columns={colunasProjetos} data={dashboard} />
      )}

      {/* ABA COM ESTATISTICAS (EM BRANCO)*/}
      {abaAtiva === 'estatisticas' && (
        <div className="text-gray-600 text-base mt-4">
          Estatísticas virão aqui.
        </div>
      )}

      {/* ABA COM TABELA PROFESSORES*/}
      {abaAtiva === 'professores' && (
        <TableComponent columns={colunasProfessores} data={tabelaprofessor} />
      )}

      {/* ABA COM TABELA ALUNOS*/}
      {abaAtiva === 'alunos' && (
        <TableComponent columns={colunasAlunos} data={tabelaaluno} />
      )}
    </PagesLayout>
  );
}

export default DashboardAdmin;
