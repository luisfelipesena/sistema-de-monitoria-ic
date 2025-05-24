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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveProjeto,
  useProjetos,
  useRejectProjeto,
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Check, Eye, FileText, Loader, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/analise-projetos',
)({
  component: AnaliseProjetosPage,
});

interface ApprovalModalData {
  projetoId: number;
  titulo: string;
  bolsasSolicitadas: number;
}

interface RejectionModalData {
  projetoId: number;
  titulo: string;
}

function AnaliseProjetosPage() {
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const approveMutation = useApproveProjeto();
  const rejectMutation = useRejectProjeto();

  const [approvalModal, setApprovalModal] = useState<ApprovalModalData | null>(
    null,
  );
  const [rejectionModal, setRejectionModal] =
    useState<RejectionModalData | null>(null);
  const [bolsasDisponibilizadas, setBolsasDisponibilizadas] =
    useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');

  // Filtrar apenas projetos submetidos
  const projetosSubmetidos =
    projetos?.filter((projeto) => projeto.status === 'SUBMITTED') || [];

  const handleApprove = async () => {
    if (!approvalModal) return;

    if (bolsasDisponibilizadas > approvalModal.bolsasSolicitadas) {
      toast.error(
        'Não é possível disponibilizar mais bolsas do que foi solicitado',
      );
      return;
    }

    try {
      await approveMutation.mutateAsync({
        projetoId: approvalModal.projetoId,
        bolsasDisponibilizadas,
        observacoes,
      });

      toast.success('Projeto aprovado com sucesso!');
      setApprovalModal(null);
      setBolsasDisponibilizadas(0);
      setObservacoes('');
    } catch (error) {
      toast.error('Erro ao aprovar projeto');
    }
  };

  const handleReject = async () => {
    if (!rejectionModal || !motivo.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        projetoId: rejectionModal.projetoId,
        motivo,
      });

      toast.success('Projeto rejeitado');
      setRejectionModal(null);
      setMotivo('');
    } catch (error) {
      toast.error('Erro ao rejeitar projeto');
    }
  };

  const openApprovalModal = (projeto: ProjetoListItem) => {
    setApprovalModal({
      projetoId: projeto.id,
      titulo: projeto.titulo,
      bolsasSolicitadas: projeto.bolsasSolicitadas,
    });
    setBolsasDisponibilizadas(projeto.bolsasSolicitadas); // Default to requested amount
  };

  const openRejectionModal = (projeto: ProjetoListItem) => {
    setRejectionModal({
      projetoId: projeto.id,
      titulo: projeto.titulo,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Submetido</Badge>
        );
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Projeto
        </div>
      ),
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
      header: 'Bolsas Solicitadas',
      accessorKey: 'bolsasSolicitadas',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.bolsasSolicitadas}</span>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.voluntariosSolicitados}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
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
            onClick={() => {
              // Navegar para detalhes do projeto
              window.open(`/projeto/${row.original.id}/inscricoes`, '_blank');
            }}
          >
            <Eye className="h-4 w-4" />
            Ver
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-full flex items-center gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => openApprovalModal(row.original)}
          >
            <Check className="h-4 w-4" />
            Aprovar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => openRejectionModal(row.original)}
          >
            <X className="h-4 w-4" />
            Rejeitar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PagesLayout title="Análise de Projetos">
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : projetosSubmetidos.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum projeto submetido para análise</p>
        </div>
      ) : (
        <TableComponent columns={columns} data={projetosSubmetidos} />
      )}

      {/* Modal de Aprovação */}
      <Dialog
        open={!!approvalModal}
        onOpenChange={(open) => {
          if (!open) {
            setApprovalModal(null);
            setBolsasDisponibilizadas(0);
            setObservacoes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Projeto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="font-medium">Projeto:</Label>
              <p className="text-sm text-gray-700">{approvalModal?.titulo}</p>
            </div>

            <div>
              <Label htmlFor="bolsasDisponibilizadas">
                Bolsas Disponibilizadas *
              </Label>
              <Input
                id="bolsasDisponibilizadas"
                type="number"
                min="0"
                max={approvalModal?.bolsasSolicitadas}
                value={bolsasDisponibilizadas}
                onChange={(e) =>
                  setBolsasDisponibilizadas(parseInt(e.target.value) || 0)
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {approvalModal?.bolsasSolicitadas} (solicitadas)
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprovar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog
        open={!!rejectionModal}
        onOpenChange={(open) => {
          if (!open) {
            setRejectionModal(null);
            setMotivo('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Projeto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="font-medium">Projeto:</Label>
              <p className="text-sm text-gray-700">{rejectionModal?.titulo}</p>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo da Rejeição *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionModal(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Rejeitar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
