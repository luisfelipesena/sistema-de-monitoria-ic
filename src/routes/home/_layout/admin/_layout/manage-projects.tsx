'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterModal, FilterValues } from '@/components/ui/FilterModal';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  useApproveProjeto,
  useBulkReminder,
  useDeleteProjeto,
  useProjetos,
  useRejectProjeto,
} from '@/hooks/use-projeto';
import { toast } from '@/hooks/use-toast';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Download,
  Eye,
  Filter,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/manage-projects',
)({
  component: ManageProjectsPage,
});

function ManageProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const deleteProjeto = useDeleteProjeto();
  const approveProjeto = useApproveProjeto();
  const rejectProjeto = useRejectProjeto();
  const bulkReminder = useBulkReminder();

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] =
    useState<ProjetoListItem | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');

  const projetosFiltrados = useMemo(() => {
    if (!projetos) return [];

    return projetos.filter((projeto) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !projeto.titulo.toLowerCase().includes(search) &&
          !projeto.professorResponsavelNome.toLowerCase().includes(search) &&
          !projeto.departamentoNome.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (filters.status && projeto.status !== filters.status) return false;
      if (
        filters.departamento &&
        projeto.departamentoId.toString() !== filters.departamento
      )
        return false;
      if (filters.semestre && projeto.semestre !== filters.semestre)
        return false;
      if (filters.ano && projeto.ano.toString() !== filters.ano) return false;
      return true;
    });
  }, [projetos, filters, searchTerm]);

  const handleViewProject = (id: number) => {
    navigate({
      to: '/home/admin/project/$id',
      params: { id: id.toString() },
    });
  };

  const handleDeleteClick = (projeto: ProjetoListItem) => {
    setProjectToDelete(projeto);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProjeto.mutateAsync(projectToDelete.id);
      toast({
        title: 'Projeto deletado',
        description: `O projeto "${projectToDelete.titulo}" foi deletado com sucesso.`,
      });
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro ao deletar projeto',
        description: 'Ocorreu um erro ao deletar o projeto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectProject = (projectId: number, selected: boolean) => {
    if (selected) {
      setSelectedProjects((prev) => [...prev, projectId]);
    } else {
      setSelectedProjects((prev) => prev.filter((id) => id !== projectId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProjects(projetosFiltrados.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProjects.length === 0) return;

    try {
      if (bulkAction === 'approve') {
        for (const projectId of selectedProjects) {
          await approveProjeto.mutateAsync({
            projetoId: projectId,
            bolsasDisponibilizadas: 1, // Default value, could be improved
          });
        }
        toast({
          title: 'Projetos aprovados',
          description: `${selectedProjects.length} projetos foram aprovados.`,
        });
      } else if (bulkAction === 'reject') {
        for (const projectId of selectedProjects) {
          await rejectProjeto.mutateAsync({
            projetoId: projectId,
            motivo: 'Rejeitado em lote pelo administrador',
          });
        }
        toast({
          title: 'Projetos rejeitados',
          description: `${selectedProjects.length} projetos foram rejeitados.`,
        });
      }

      setSelectedProjects([]);
      setBulkAction('');
    } catch (error) {
      toast({
        title: 'Erro na ação em lote',
        description: 'Ocorreu um erro ao processar a ação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const canDeleteProject = (projeto: ProjetoListItem) => {
    return projeto.status === 'DRAFT' || projeto.status === 'REJECTED';
  };

  const handleExportReport = () => {
    const currentYear = new Date().getFullYear();
    const currentSemester = new Date().getMonth() <= 6 ? '1' : '2';
    const url = `/api/relatorios/planilhas-prograd?ano=${currentYear}&semestre=SEMESTRE_${currentSemester}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = `monitores-${currentYear}-${currentSemester}-completo.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Relatório sendo gerado',
      description: 'O download do relatório será iniciado em breve.',
    });
  };

  const handleSendReminder = async (
    type: 'PROJECT_SUBMISSION' | 'DOCUMENT_SIGNING' | 'SELECTION_PENDING',
  ) => {
    try {
      const result = await bulkReminder.mutateAsync({
        type,
        customMessage: 'Enviado através do painel administrativo',
      });

      toast({
        title: 'Lembretes enviados',
        description: `${result.emailsSent} emails foram enviados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar lembretes',
        description: 'Ocorreu um erro ao enviar os lembretes. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            handleSelectAll(!!value);
          }}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProjects.includes(row.original.id)}
          onCheckedChange={(value) => {
            handleSelectProject(row.original.id, !!value);
          }}
          aria-label="Selecionar projeto"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: 'Projeto',
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.titulo}</span>
          <div className="text-sm text-gray-500">
            ID: #{row.original.id} • {row.original.departamentoNome}
          </div>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorResponsavelNome',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.professorResponsavelNome}
          </span>
        </div>
      ),
    },
    {
      header: 'Semestre',
      accessorKey: 'semestre',
      cell: ({ row }) => (
        <span>
          {row.original.ano}.{row.original.semestre === 'SEMESTRE_1' ? 1 : 2}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusMap = {
          DRAFT: { label: 'Rascunho', variant: 'secondary' as const },
          SUBMITTED: { label: 'Em Análise', variant: 'muted' as const },
          PENDING_ADMIN_SIGNATURE: {
            label: 'Pend. Assinatura',
            variant: 'warning' as const,
          },
          APPROVED: { label: 'Aprovado', variant: 'success' as const },
          REJECTED: { label: 'Rejeitado', variant: 'destructive' as const },
        };
        const config = statusMap[status as keyof typeof statusMap] || {
          label: status,
          variant: 'secondary' as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      header: 'Bolsas',
      accessorKey: 'bolsasDisponibilizadas',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-medium">
            {row.original.bolsasDisponibilizadas || 0}
          </span>
          <div className="text-xs text-gray-500">
            {row.original.bolsasSolicitadas} solicitadas
          </div>
        </div>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => (
        <div className="text-center">{row.original.voluntariosSolicitados}</div>
      ),
    },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProject(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canDeleteProject(row.original) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClick(row.original)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </PagesLayout>
    );
  }

  const pageActions = (
    <>
      <Button
        variant="outline"
        onClick={() => setFilterModalOpen(true)}
        className="text-gray-600"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
      </Button>
      <Button
        variant="outline"
        onClick={() => handleSendReminder('PROJECT_SUBMISSION')}
        disabled={bulkReminder.isPending}
        className="text-orange-600 border-orange-300 hover:bg-orange-50"
      >
        <Users className="w-4 h-4 mr-2" />
        {bulkReminder.isPending ? 'Enviando...' : 'Enviar Lembretes'}
      </Button>
      <Button
        variant="outline"
        onClick={handleExportReport}
        className="text-green-600 border-green-300 hover:bg-green-50"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar Relatório
      </Button>
      <Button
        className="bg-[#1B2A50] text-white hover:bg-[#24376c]"
        onClick={() => navigate({ to: '/home/admin/projects' })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Projeto
      </Button>
    </>
  );

  return (
    <PagesLayout
      title="Gerenciar Projetos"
      subtitle="Administração completa de projetos de monitoria"
      actions={pageActions}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título, professor ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {selectedProjects.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedProjects.length} projeto(s) selecionado(s)
                </span>
                <div className="flex items-center gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ação em lote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Aprovar</SelectItem>
                      <SelectItem value="reject">Rejeitar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    size="sm"
                  >
                    Executar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {projetos?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de Projetos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {projetos?.filter((p) => p.status === 'APPROVED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {projetos?.filter((p) => p.status === 'SUBMITTED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Em Análise</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {projetos?.filter((p) => p.status === 'REJECTED').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Rejeitados</p>
            </CardContent>
          </Card>
        </div>

        {Object.values(filters).some(Boolean) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Filtros ativos: {Object.values(filters).filter(Boolean).length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
                className="text-blue-600 border-blue-300"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Projetos de Monitoria ({projetosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjetos ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando projetos...</p>
                </div>
              </div>
            ) : (
              <TableComponent columns={columns} data={projetosFiltrados} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o projeto{' '}
              <strong>{projectToDelete?.titulo}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e removerá permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os dados do projeto</li>
                <li>Disciplinas associadas</li>
                <li>Professores participantes</li>
                <li>Atividades planejadas</li>
                <li>Documentos relacionados</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteProjeto.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProjeto.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteProjeto.isPending ? 'Deletando...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={setFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  );
}
