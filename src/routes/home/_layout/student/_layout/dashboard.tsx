import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';

import { Calendar, Link as LinkIcon, List, User, Users } from 'lucide-react';

export const Route = createFileRoute('/home/_layout/student/_layout/dashboard')(
  {
    component: DashboardStudent,
  },
);

interface ProjectData {
  id: number;
  disciplina: string;
  professor: string;
  tipo: string;
  status: string;
  vagas: number;
  dashboardUrl: string;
}

function DashboardStudent() {
  // Mock data for dashboard
  const dashboard: ProjectData[] = [
    {
      id: 1,
      disciplina: 'MATA55',
      professor: 'George R.R Martin',
      tipo: 'Voluntário',
      status: 'Aprovado',
      vagas: 10,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 2,
      disciplina: 'MATC84',
      professor: 'Markus Suzak',
      tipo: 'Bolsista',
      status: 'Finalizado',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 3,
      disciplina: 'MATA55',
      professor: 'Ankur Warikoo',
      tipo: 'Voluntário',
      status: 'Em analise',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 4,
      disciplina: 'MATA53',
      professor: 'Jodi Picoult',
      tipo: 'Bolsista',
      status: 'Inscrito',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 5,
      disciplina: 'MATA37',
      professor: 'James Clear',
      tipo: 'Bolsista',
      status: 'Inscrito',
      vagas: 5,
      dashboardUrl: 'https://abc.in',
    },
    {
      id: 6,
      disciplina: 'MATA50',
      professor: 'Frank Herbert',
      tipo: 'Voluntário',
      status: 'Inscrito',
      vagas: 12,
      dashboardUrl: 'https://abc.in',
    },
  ];

  // Column definitions for the student dashboard
  const columns: ColumnDef<ProjectData>[] = [
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
          <User className="h-5 w-5 text-gray-400" />
          Docente
        </div>
      ),
      accessorKey: 'professor',
      cell: ({ row }) => (
        <span className="text-base">{row.original.professor}</span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Tipo
        </div>
      ),
      accessorKey: 'tipo',
      cell: ({ row }) => {
        if (row.original.tipo === 'Voluntário') {
          return <Badge variant="retaVerde">Voluntário</Badge>;
        } else {
          return <Badge variant="retaVermelha">Bolsista</Badge>;
        }
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        if (row.original.status === 'Aprovado') {
          return <Badge variant="success">Aprovado</Badge>;
        } else if (row.original.status === 'Finalizado') {
          return <Badge variant="destructive">Finalizado</Badge>;
        } else if (row.original.status === 'Em analise') {
          return <Badge variant="warning">Em analise</Badge>;
        } else {
          return <Badge variant="muted">Inscrito</Badge>;
        }
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Nº de vagas
        </div>
      ),
      accessorKey: 'vagas',
      cell: ({ row }) => (
        <div className="text-center text-base">{row.original.vagas}</div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-gray-400" />
          Pagina da Vaga
        </div>
      ),
      accessorKey: 'dashboardUrl',
      cell: ({ row }) => (
        <a
          href={row.original.dashboardUrl}
          className="text-primary hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.original.dashboardUrl}
        </a>
      ),
    },
  ];

  // Actions buttons
  const actions = (
    <>
      <Button
        variant="primary"
        className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      >
        + Ver lista de editais abertos
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
    <PagesLayout title="Dashboard" actions={actions}>
      <TableComponent columns={columns} data={dashboard} />
    </PagesLayout>
  );
}

export default DashboardStudent;
