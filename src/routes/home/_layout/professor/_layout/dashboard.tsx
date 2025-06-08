import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { useProjetos, useDeleteProjeto } from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import {
  Eye,
  Filter,
  Hand,
  List,
  Loader,
  Plus,
  Users,
  FileSignature,
  Trash2,
} from 'lucide-react';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/dashboard',
)({
  component: DashboardProfessor,
});

function DashboardProfessor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const deleteProjeto = useDeleteProjeto();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState<ProjetoListItem | null>(null);

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
      to: '/home/professor/document-signing',
      search: { projectId: projetoId },
    });
  };

  const handleViewPDF = (projetoId: number) => {
    window.open(`/api/projeto/${projetoId}/pdf`, '_blank');
  };

  const handleEditProject = (projetoId: number) => {
    navigate({
      to: '/home/professor/document-signing',
      search: { projectId: projetoId },
    });
  };

  const handleCriarProjeto = () => {
    navigate({ to: '/home/professor/projects' });
  };

  const handleDeleteProjeto = (projeto: ProjetoListItem) => {
    setProjetoToDelete(projeto);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProjeto = () => {
    if (!projetoToDelete) return;

    deleteProjeto.mutate(projetoToDelete.id, {
      onSuccess: () => {
        toast({
          title: 'Projeto excluído',
          description: 'O projeto foi excluído com sucesso.',
        });
        setDeleteDialogOpen(false);
        setProjetoToDelete(null);
      },
      onError: (error) => {
        toast({
          title: 'Erro ao excluir projeto',
          description: error.message || 'Ocorreu um erro ao excluir o projeto.',
          variant: 'destructive',
        });
      },
    });
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
      cell: ({ row }) => {
        const projeto = row.original;
        
        return (
          <div className="flex gap-2">
            {projeto.status === 'DRAFT' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full flex items-center gap-1"
                  onClick={() => handleEditProject(projeto.id)}
                >
                  <FileSignature className="h-4 w-4" />
                  Assinar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full flex items-center gap-1"
                  onClick={() => handleDeleteProjeto(projeto)}
                  disabled={deleteProjeto.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}
            
            {(projeto.status === 'SUBMITTED' || projeto.status === 'REJECTED') && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => handleViewPDF(projeto.id)}
              >
                <Eye className="h-4 w-4" />
                Ver PDF
              </Button>
            )}
            
            {projeto.status === 'APPROVED' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full flex items-center gap-1"
                  onClick={() => handleViewPDF(projeto.id)}
                >
                  <Eye className="h-4 w-4" />
                  Ver PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-full flex items-center gap-1"
                  onClick={() => handleAnalisarProjeto(projeto.id)}
                >
                  <Users className="h-4 w-4" />
                  Ver Candidatos
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Action buttons
  const dashboardActions = (
    <>
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

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto{' '}
              <span className="font-semibold">
                {projetoToDelete?.disciplinas?.[0]?.codigo || 'N/A'}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setProjetoToDelete(null);
              }}
              disabled={deleteProjeto.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProjeto}
              disabled={deleteProjeto.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjeto.isPending ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PagesLayout>
  );
}

export default DashboardProfessor;
