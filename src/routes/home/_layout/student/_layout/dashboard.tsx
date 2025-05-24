import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { useMinhasInscricoes } from '@/hooks/use-inscricao';
import { InscricaoComDetalhes } from '@/routes/api/inscricao/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import {
  Calendar,
  FileText,
  Filter,
  List,
  Loader,
  Plus,
  User,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/student/_layout/dashboard')(
  {
    component: DashboardStudent,
  },
);

function DashboardStudent() {
  const navigate = useNavigate();
  const { data: inscricoes, isLoading: loadingInscricoes } =
    useMinhasInscricoes();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  // Aplicar filtros às inscrições
  const inscricoesFiltradas = useMemo(() => {
    if (!inscricoes) return [];

    return inscricoes.filter((inscricao) => {
      if (filters.status && inscricao.status !== filters.status) return false;
      if (filters.tipoVaga && inscricao.tipoVagaPretendida !== filters.tipoVaga)
        return false;
      return true;
    });
  }, [inscricoes, filters]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleVerVagas = () => {
    navigate({ to: '/home/common/monitoria' });
  };

  // Column definitions for the student dashboard
  const columns: ColumnDef<InscricaoComDetalhes>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: 'disciplinas',
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas;
        const codigoDisciplina =
          disciplinas.length > 0 ? disciplinas[0].codigo : 'N/A';
        return (
          <span className="font-semibold text-base text-gray-900">
            {codigoDisciplina}
          </span>
        );
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Docente
        </div>
      ),
      accessorKey: 'projeto',
      cell: ({ row }) => {
        return (
          <span className="text-base">
            {row.original.projeto.professorResponsavel.nomeCompleto}
          </span>
        );
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Tipo
        </div>
      ),
      accessorKey: 'tipoVagaPretendida',
      cell: ({ row }) => {
        const tipo = row.original.tipoVagaPretendida;
        if (tipo === 'VOLUNTARIO') {
          return <Badge variant="retaVerde">Voluntário</Badge>;
        } else if (tipo === 'BOLSISTA') {
          return <Badge variant="retaVermelha">Bolsista</Badge>;
        } else {
          return <Badge variant="outline">Qualquer</Badge>;
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
        const status = row.original.status;
        if (
          status === 'SELECTED_BOLSISTA' ||
          status === 'SELECTED_VOLUNTARIO'
        ) {
          return (
            <Badge variant="warning">Selecionado - Aguardando resposta</Badge>
          );
        } else if (
          status === 'ACCEPTED_BOLSISTA' ||
          status === 'ACCEPTED_VOLUNTARIO'
        ) {
          return <Badge variant="success">Aprovado</Badge>;
        } else if (status === 'REJECTED_BY_PROFESSOR') {
          return <Badge variant="destructive">Rejeitado pelo Professor</Badge>;
        } else if (status === 'REJECTED_BY_STUDENT') {
          return <Badge variant="destructive">Recusado por você</Badge>;
        } else if (status === 'SUBMITTED') {
          return <Badge variant="muted">Inscrito</Badge>;
        }
        return <Badge variant="muted">{status}</Badge>;
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Projeto
        </div>
      ),
      accessorKey: 'projeto',
      cell: ({ row }) => (
        <div className="text-center text-base">
          {row.original.projeto.titulo}
        </div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Data de Inscrição
        </div>
      ),
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  // Actions buttons
  const actions = (
    <>
      <Button
        variant="primary"
        className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
        onClick={handleVerVagas}
      >
        <Plus className="w-4 h-4 mr-2" />
        Ver Vagas Disponíveis
      </Button>
      <Button
        variant="outline"
        className="text-gray-600"
        onClick={() => setFilterModalOpen(true)}
      >
        <Filter className="w-4 h-4 mr-1" />
        Filtros
      </Button>
    </>
  );

  return (
    <PagesLayout title="Dashboard" actions={actions}>
      {loadingInscricoes ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando suas inscrições...</span>
        </div>
      ) : inscricoesFiltradas && inscricoesFiltradas.length > 0 ? (
        <>
          {filters.status || filters.tipoVaga ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Filtros ativos:{' '}
                  {Object.values(filters).filter(Boolean).length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          ) : null}
          <TableComponent columns={columns} data={inscricoesFiltradas} />
        </>
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhuma inscrição encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {inscricoes && inscricoes.length === 0
              ? 'Você ainda não se inscreveu em nenhum projeto de monitoria.'
              : 'Nenhuma inscrição corresponde aos filtros selecionados.'}
          </p>
          <Button onClick={handleVerVagas}>
            {inscricoes && inscricoes.length === 0
              ? 'Ver Vagas Disponíveis'
              : 'Buscar Mais Vagas'}
          </Button>
        </div>
      )}

      {/* Modal de Filtros */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="student"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}

export default DashboardStudent;
