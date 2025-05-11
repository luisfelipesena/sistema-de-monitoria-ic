<<<<<<< Updated upstream
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
=======
import { useAuth } from '@//hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

>>>>>>> Stashed changes
import {
  Calendar,
  Eye,
  Link as LinkIcon,
  List,
  User,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/test/')({
  component: HomePage,
});

function HomePage() {
  // Mock data for editais
  const editais = [
    {
      id: 1,
      disciplina: 'MATA55',
      professor: 'George R.R Martin',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 10,
      editalUrl: 'https://abc.in',
    },
    {
      id: 2,
      disciplina: 'MATC84',
      professor: 'Markus Suzak',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 3,
      disciplina: 'MATA55',
      professor: 'Ankur Warikoo',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 4,
      disciplina: 'MATA53',
      professor: 'Jodi Picoult',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 5,
      disciplina: 'MATA37',
      professor: 'James Clear',
      tipo: 'Bolsista',
      dataLimite: '02/04/2025',
      vagas: 5,
      editalUrl: 'https://abc.in',
    },
    {
      id: 6,
      disciplina: 'MATA50',
      professor: 'Frank Herbert',
      tipo: 'Voluntário',
      dataLimite: '02/04/2025',
      vagas: 12,
      editalUrl: 'https://abc.in',
    },
  ];

<<<<<<< Updated upstream
  // Definição de colunas para o TableComponent
  const columns: ColumnDef<(typeof editais)[0]>[] = [
    {
      accessorKey: 'disciplina',
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-base text-gray-900">
          {row.original.disciplina}
        </div>
      ),
    },
    {
      accessorKey: 'professor',
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Docente
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-base">{row.original.professor}</div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Tipo
        </div>
      ),
      cell: ({ row }) => (
        <div>
          {row.original.tipo === 'Voluntário' ? (
            <Badge variant="secondary" className="rounded-full">
              Voluntário
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full">
              Bolsista
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dataLimite',
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          Data Limite
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.dataLimite}</div>
      ),
    },
    {
      accessorKey: 'vagas',
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Nº de vagas
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center text-base">{row.original.vagas}</div>
      ),
    },
    {
      accessorKey: 'editalUrl',
      header: () => (
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-gray-400" />
          Edital
        </div>
      ),
      cell: ({ row }) => (
        <a
          href={row.original.editalUrl}
          className="text-primary hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.original.editalUrl}
        </a>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      cell: () => (
        <Button
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Inscrever
        </Button>
      ),
    },
  ];
=======
  const { user } = useAuth();
>>>>>>> Stashed changes

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome message */}
      <h1 className="text-5xl font-bold mb-8">Olá, {user?.username || 'Usuário'}!</h1>

      {/* Tabela padronizada */}
      <h2 className="text-2xl font-normal mb-6">
        Todos os editais abertos para monitoria com bolsa e voluntários
      </h2>

      <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
        <TableComponent
          columns={columns}
          data={editais}
          searchableColumn="disciplina"
          searchPlaceholder="Buscar por disciplina..."
        />
      </div>
    </div>
  );
}

export default HomePage;
