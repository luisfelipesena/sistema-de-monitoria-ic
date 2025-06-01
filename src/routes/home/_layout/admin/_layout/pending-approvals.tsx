'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  useApproveProjeto,
  useProjetos,
  useRejectProjeto,
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Eye, FileSignature, Loader, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/pending-approvals',
)({
  component: PendingApprovalsComponent,
});

function PendingApprovalsComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const approveMutation = useApproveProjeto();
  const rejectMutation = useRejectProjeto();

  const [selectedProject, setSelectedProject] =
    useState<ProjetoListItem | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Filter only SUBMITTED projects for admin approval
  const pendingProjetos = useMemo(() => {
    return projetos?.filter((projeto) => projeto.status === 'SUBMITTED') || [];
  }, [projetos]);

  const handleApprove = async (projeto: ProjetoListItem) => {
    try {
      await approveMutation.mutateAsync({
        projetoId: projeto.id,
        bolsasDisponibilizadas: projeto.bolsasSolicitadas,
      });
      toast.success(
        'Projeto aprovado! Você será redirecionado para assinar o documento.',
      );
      refetch();
      // Redirect to document signing page
      navigate({ to: '/home/admin/document-signing' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar projeto');
    }
  };

  const handleReject = async () => {
    if (!selectedProject || !rejectReason.trim()) {
      toast.error('Por favor, forneça um motivo para a rejeição');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        projetoId: selectedProject.id,
        motivo: rejectReason,
      });
      toast.success('Projeto rejeitado com sucesso');
      setRejectDialogOpen(false);
      setSelectedProject(null);
      setRejectReason('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar projeto');
    }
  };

  const columns: ColumnDef<ProjetoListItem>[] = [
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.description
              ? row.original.description.substring(0, 100) + '...'
              : ''}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'professorResponsavelNome',
      header: 'Professor Responsável',
    },
    {
      accessorKey: 'departamentoNome',
      header: 'Departamento',
    },
    {
      accessorKey: 'semestre',
      header: 'Período',
      cell: ({ row }) => (
        <span>
          {row.original.ano}.{row.original.semestre === 'SEMESTRE_1' ? 1 : 2}
        </span>
      ),
    },
    {
      accessorKey: 'bolsasSolicitadas',
      header: 'Vagas',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>Bolsas: {row.original.bolsasSolicitadas}</div>
          <div>Voluntários: {row.original.voluntariosSolicitados}</div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate({
                to: '/home/admin/project/$id',
                params: { id: row.original.id.toString() },
              })
            }
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalhes
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleApprove(row.original)}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprovar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedProject(row.original);
              setRejectDialogOpen(true);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Rejeitar
          </Button>
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

  return (
    <PagesLayout
      title="Projetos Pendentes de Aprovação"
      subtitle="Revise e aprove projetos de monitoria submetidos pelos professores"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando projetos...</p>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Projetos Aguardando Aprovação
                {pendingProjetos.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {pendingProjetos.length} projeto(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProjetos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhum projeto pendente
                  </h3>
                  <p>
                    Todos os projetos foram revisados ou não há projetos
                    aguardando aprovação.
                  </p>
                </div>
              ) : (
                <TableComponent data={pendingProjetos} columns={columns} />
              )}
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Processo de Aprovação de Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <p>Revise os detalhes do projeto clicando em "Ver Detalhes"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <p>Verifique se o projeto atende aos requisitos do programa</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <p>
                  Aprove o projeto para prosseguir com a assinatura do documento
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <p>
                  Ou rejeite o projeto fornecendo um motivo para o professor
                  fazer ajustes
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Projeto</DialogTitle>
            <DialogDescription>
              Por favor, forneça um motivo para a rejeição. Este feedback será
              enviado ao professor responsável.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Descreva o motivo da rejeição e possíveis ajustes necessários..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                'Confirmar Rejeição'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
