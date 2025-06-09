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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Trash2,
  Users,
  X,
  CheckCircle,
  FileSignature,
  Loader,
  AlertCircle,
  ArrowRight,
  Info,
  Bell,
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [projectToReject, setProjectToReject] =
    useState<ProjetoListItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const pendingApprovals = useMemo(() => {
    return projetos?.filter((projeto) => projeto.status === 'SUBMITTED') || [];
  }, [projetos]);

  const pendingSignatures = useMemo(() => {
    return projetos?.filter((projeto) => projeto.status === 'PENDING_ADMIN_SIGNATURE') || [];
  }, [projetos]);

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

  const handleApprove = async (projeto: ProjetoListItem) => {
    try {
      await approveProjeto.mutateAsync({
        projetoId: projeto.id,
        bolsasDisponibilizadas: projeto.bolsasSolicitadas,
      });
      toast({
        title: 'Projeto aprovado!',
        description: 'Agora você pode assinar o documento.',
      });
      navigate({ 
        to: '/home/admin/document-signing',
        search: { projectId: projeto.id }
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar projeto',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectClick = (projeto: ProjetoListItem) => {
    setProjectToReject(projeto);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!projectToReject || !rejectReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, forneça um motivo para a rejeição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await rejectProjeto.mutateAsync({
        projetoId: projectToReject.id,
        motivo: rejectReason,
      });
      toast({
        title: 'Projeto rejeitado',
        description: 'O feedback foi enviado ao professor.',
      });
      setRejectModalOpen(false);
      setProjectToReject(null);
      setRejectReason('');
    } catch (error: any) {
      toast({
        title: 'Erro ao rejeitar projeto',
        description: error.message || 'Tente novamente.',
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
            bolsasDisponibilizadas: 1,
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
    const url = `/api/relatorios/planilhas-prograd`;

    const link = document.createElement('a');
    link.href = url;
    link.download = `planilha-prograd.xlsx`;
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

  const getActionButtons = (projeto: ProjetoListItem) => {
    const buttons = [
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => handleViewProject(projeto.id)}
      >
        <Eye className="h-4 w-4" />
      </Button>
    ];

    if (projeto.status === 'SUBMITTED') {
      buttons.push(
        <Button
          key="approve"
          variant="outline"
          size="sm"
          onClick={() => handleApprove(projeto)}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={approveProjeto.isPending}
        >
          {approveProjeto.isPending ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </Button>,
        <Button
          key="reject"
          variant="outline" 
          size="sm"
          onClick={() => handleRejectClick(projeto)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      );
    }

    if (projeto.status === 'PENDING_ADMIN_SIGNATURE') {
      buttons.push(
        <Button
          key="sign"
          variant="outline"
          size="sm"
          onClick={() => navigate({ 
            to: '/home/admin/document-signing',
            search: { projectId: projeto.id }
          })}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <FileSignature className="h-4 w-4" />
        </Button>
      );
    }

    if (canDeleteProject(projeto)) {
      buttons.push(
        <Button
          key="delete"
          variant="outline"
          size="sm"
          onClick={() => handleDeleteClick(projeto)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    }

    return buttons;
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
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.titulo}</span>
            {row.original.status === 'SUBMITTED' && (
              <Badge variant="warning" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Ação Requerida
              </Badge>
            )}
            {row.original.status === 'PENDING_ADMIN_SIGNATURE' && (
              <Badge variant="default" className="text-xs bg-blue-600">
                <FileSignature className="h-3 w-3 mr-1" />
                Assinar
              </Badge>
            )}
          </div>
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
          SUBMITTED: { label: 'Aguardando Aprovação', variant: 'warning' as const },
          PENDING_ADMIN_SIGNATURE: {
            label: 'Aguardando Assinatura',
            variant: 'default' as const,
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
          {getActionButtons(row.original)}
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
        Planilhas PROGRAD
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
        {/* Alertas de ação prioritária */}
        {(pendingApprovals.length > 0 || pendingSignatures.length > 0) && (
          <div className="space-y-3">
            {pendingApprovals.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{pendingApprovals.length} projeto(s)</strong> aguardando sua aprovação.
                      <span className="ml-2">
                        Revise → Aprove/Rejeite → Assine documento
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ status: 'SUBMITTED' })}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      Ver Projetos Pendentes
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {pendingSignatures.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <FileSignature className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{pendingSignatures.length} projeto(s)</strong> aguardando sua assinatura.
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: '/home/admin/document-signing' })}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <FileSignature className="h-4 w-4 mr-1" />
                      Assinar Documentos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {projetos?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={pendingApprovals.length > 0 ? "ring-2 ring-yellow-200" : ""}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingApprovals.length}
              </div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
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
          <Card className={pendingSignatures.length > 0 ? "ring-2 ring-blue-200" : ""}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {pendingSignatures.length}
              </div>
              <p className="text-sm text-muted-foreground">P/ Assinar</p>
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

      {/* Reject Confirmation Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Rejeitar Projeto
            </DialogTitle>
            <DialogDescription>
              Por favor, forneça um motivo detalhado para a rejeição. Este feedback será
              enviado ao professor responsável para que possa fazer os ajustes necessários.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Exemplo: O projeto precisa de mais detalhes sobre os objetivos de aprendizagem, as atividades propostas não estão claras, o número de vagas solicitadas não condiz com a carga horária..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Um feedback detalhado ajuda o professor a entender melhor o que precisa ser ajustado.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason('');
                setProjectToReject(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectProjeto.isPending}
            >
              {rejectProjeto.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirmar Rejeição
                </>
              )}
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
