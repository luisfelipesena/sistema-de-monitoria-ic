import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteProjeto, useProjetos } from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Loader, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/projetos')({
  component: ProjetosAdminPage,
});

function ProjetosAdminPage() {
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const deleteProjeto = useDeleteProjeto();
  const [deleteModal, setDeleteModal] = useState<ProjetoListItem | null>(null);

  const handleEditProjeto = (projeto: ProjetoListItem) => {
    navigate({
      to: '/home/common/projects',
      search: { edit: projeto.id },
    });
  };

  const handleViewProjeto = (projeto: ProjetoListItem) => {
    navigate({
      to: '/home/common/projects/$projeto/inscricoes',
      params: { projeto: projeto.id.toString() },
    });
  };

  const handleDeleteProjeto = async () => {
    if (!deleteModal) return;

    try {
      await deleteProjeto.mutateAsync(deleteModal.id);
      toast.success('Projeto excluído com sucesso!');
      setDeleteModal(null);
    } catch (error) {
      toast.error('Erro ao excluir projeto');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'SUBMITTED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Em análise</Badge>
        );
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      header: 'Projeto',
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-base text-gray-900">
            {row.original.titulo}
          </span>
          <p className="text-sm text-gray-500">
            {row.original.departamentoNome}
          </p>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorResponsavelNome',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.professorResponsavelNome}</span>
      ),
    },
    {
      header: 'Período',
      accessorKey: 'ano',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.ano}.
          {row.original.semestre === 'SEMESTRE_1' ? '1' : '2'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Bolsas',
      accessorKey: 'bolsasDisponibilizadas',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-medium">
            {row.original.bolsasDisponibilizadas || 0}
          </span>
          <span className="text-gray-500">
            /{row.original.bolsasSolicitadas}
          </span>
        </div>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-medium">
            {row.original.voluntariosSolicitados}
          </span>
        </div>
      ),
    },
    {
      header: 'Inscritos',
      accessorKey: 'totalInscritos',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-medium">{row.original.totalInscritos}</span>
        </div>
      ),
    },
    {
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleViewProjeto(row.original)}
          >
            <Eye className="h-4 w-4" />
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditProjeto(row.original)}
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => setDeleteModal(row.original)}
            disabled={row.original.totalInscritos > 0}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  const actions = (
    <Button
      onClick={() => navigate({ to: '/home/common/projects' })}
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
    >
      <Plus className="w-4 h-4 mr-2" />
      Novo Projeto
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Projetos" actions={actions}>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Gerenciamento de Projetos
        </h3>
        <p className="text-blue-800 text-sm">
          Gerencie todos os projetos de monitoria do sistema. Você pode criar,
          editar, visualizar e excluir projetos conforme necessário.
        </p>
      </div>

      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : projetos && projetos.length > 0 ? (
        <TableComponent columns={columns} data={projetos} />
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando o primeiro projeto de monitoria do sistema.
          </p>
          <Button onClick={() => navigate({ to: '/home/common/projects' })}>
            Criar Primeiro Projeto
          </Button>
        </div>
      )}

      <Dialog
        open={!!deleteModal}
        onOpenChange={(open) => !open && setDeleteModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Tem certeza que deseja excluir o projeto:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold">{deleteModal?.titulo}</p>
              <p className="text-sm text-gray-600">
                {deleteModal?.departamentoNome}
              </p>
            </div>
            <p className="text-sm text-red-600">
              Esta ação não pode ser desfeita.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProjeto}
              disabled={deleteProjeto.isPending}
            >
              {deleteProjeto.isPending ? 'Excluindo...' : 'Excluir Projeto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
