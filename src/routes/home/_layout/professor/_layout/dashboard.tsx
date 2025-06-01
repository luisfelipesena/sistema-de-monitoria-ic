import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { useProjetos, useSubmitProjeto } from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Eye,
  Filter,
  Hand,
  List,
  Loader,
  Plus,
  Send,
  Users,
} from 'lucide-react';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/dashboard',
)({
  component: DashboardProfessor,
});

function DashboardProfessor() {
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const submitProjetoMutation = useSubmitProjeto();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  // Aplicar filtros aos projetos
  const projetosFiltrados = useMemo(() => {
    if (!projetos) return [];

    return projetos.filter((projeto) => {
      if (filters.status && projeto.status !== filters.status) return false;
      if (filters.semestre && projeto.semestre !== filters.semestre)
        return false;
      if (filters.ano && projeto.ano.toString() !== filters.ano) return false;
      return true;
    });
  }, [projetos, filters]);

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleAnalisarProjeto = (projetoId: number) => {
    navigate({
      to: '/home/common/projects/$projeto/inscricoes',
      params: { projeto: projetoId.toString() },
    });
  };

  const handleCriarProjeto = () => {
    navigate({ to: '/home/professor/projects' });
  };

  const handleSubmitProjeto = async (projetoId: number) => {
    try {
      await submitProjetoMutation.mutateAsync(projetoId);
      toast.success('Projeto submetido para aprovação com sucesso!');
    } catch (error) {
      toast.error('Erro ao submeter projeto. Tente novamente.');
    }
  };

  // Column definitions for the projects table
  const colunasProjetos: ColumnDef<ProjetoListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: 'titulo',
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
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED') {
          return <Badge variant="success">Aprovado</Badge>;
        } else if (status === 'REJECTED') {
          return <Badge variant="destructive">Rejeitado</Badge>;
        } else if (status === 'SUBMITTED') {
          return <Badge variant="warning">Em análise</Badge>;
        } else if (status === 'DRAFT') {
          return <Badge variant="muted">Rascunho</Badge>;
        }
        return <Badge variant="muted">{status}</Badge>;
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsistas
        </div>
      ),
      accessorKey: 'bolsasDisponibilizadas',
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas || 0;
        const status = row.original.status;
        if (status === 'APPROVED') {
          return <span>{bolsas}</span>;
        }
        return <span>-</span>;
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED') {
          return (
            <div className="text-center">
              {row.original.voluntariosSolicitados}
            </div>
          );
        }
        return <div className="text-center">-</div>;
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: 'totalInscritos',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'APPROVED') {
          return (
            <div className="text-center text-base">
              {row.original.totalInscritos}
            </div>
          );
        }
        return <div className="text-center">-</div>;
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === 'DRAFT' ? (
            <Button
              variant="primary"
              size="sm"
              className="rounded-full flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSubmitProjeto(row.original.id)}
              disabled={submitProjetoMutation.isPending}
            >
              <Send className="h-4 w-4" />
              Submeter
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="rounded-full flex items-center gap-1"
              onClick={() => handleAnalisarProjeto(row.original.id)}
            >
              <Eye className="h-4 w-4" />
              {row.original.status === 'APPROVED'
                ? 'Ver Candidatos'
                : 'Analisar'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleGerenciarCandidatos = () => {
    navigate({ to: '/home/professor/project-applications' });
  };

  // Action buttons
  const dashboardActions = (
    <>
      <Button
        variant="primary"
        className="bg-green-600 text-white hover:bg-green-700 transition-colors"
        onClick={handleGerenciarCandidatos}
      >
        <Users className="w-4 h-4 mr-2" />
        Gerenciar Candidatos
      </Button>
      <Button
        variant="primary"
        className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
        onClick={handleCriarProjeto}
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Projeto
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
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : projetosFiltrados && projetosFiltrados.length > 0 ? (
        <>
          {filters.status || filters.semestre || filters.ano ? (
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
          <TableComponent columns={colunasProjetos} data={projetosFiltrados} />
        </>
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {projetos && projetos.length === 0
              ? 'Você ainda não criou nenhum projeto de monitoria.'
              : 'Nenhum projeto corresponde aos filtros selecionados.'}
          </p>
          <Button onClick={handleCriarProjeto}>
            {projetos && projetos.length === 0
              ? 'Criar Primeiro Projeto'
              : 'Criar Novo Projeto'}
          </Button>
        </div>
      )}

      {/* Modal de Filtros */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="professor"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}

export default DashboardProfessor;
