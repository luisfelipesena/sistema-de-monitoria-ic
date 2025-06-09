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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import {
  useApproveProjeto,
  useProjetos,
  useRejectProjeto,
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { 
  CheckCircle, 
  Eye, 
  FileSignature, 
  Loader, 
  X, 
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
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
        'Projeto aprovado! Agora você pode assinar o documento.',
      );
      refetch();
      // Redirect to document signing page for this specific project
      navigate({ 
        to: '/home/admin/document-signing',
        search: { projectId: projeto.id }
      });
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
            {row.original.descricao
              ? row.original.descricao.substring(0, 80) + '...'
              : ''}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'professorResponsavelNome',
      header: 'Professor Responsável',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.professorResponsavelNome}</div>
          <div className="text-muted-foreground">{row.original.departamentoNome}</div>
        </div>
      ),
    },
    {
      accessorKey: 'semestre',
      header: 'Período',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.ano}.{row.original.semestre === 'SEMESTRE_1' ? 1 : 2}
        </Badge>
      ),
    },
    {
      accessorKey: 'bolsasSolicitadas',
      header: 'Vagas Solicitadas',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
              {row.original.bolsasSolicitadas}
            </span>
            <span className="text-muted-foreground">Bolsas</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
              {row.original.voluntariosSolicitados}
            </span>
            <span className="text-muted-foreground">Voluntários</span>
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações Requeridas',
      cell: ({ row }) => (
        <div className="space-y-2">
          {/* Step 1: Review */}
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
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
              Revisar Projeto
            </Button>
          </div>
          
          {/* Step 2: Decision */}
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <div className="flex gap-2">
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
          </div>
          
          {/* Step 3: Next Action */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span>Após aprovação → Assinar documento</span>
          </div>
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
          {/* Alert with process flow */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Processo de Aprovação:</strong> 
              <span className="ml-2">
                1. Revise o projeto → 2. Aprove/Rejeite → 3. Assine o documento (após aprovação)
              </span>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Projetos Aguardando Sua Aprovação
                {pendingProjetos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                    {pendingProjetos.length} projeto(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProjetos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhum projeto pendente de aprovação
                  </h3>
                  <p className="mb-4">
                    Todos os projetos foram revisados ou não há projetos
                    aguardando aprovação.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: '/home/admin/document-signing' })}
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Ver Projetos para Assinatura
                  </Button>
                </div>
              ) : (
                <TableComponent data={pendingProjetos} columns={columns} />
              )}
            </CardContent>
          </Card>

          {/* Process Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Como Funciona o Processo de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                    1
                  </div>
                  <h4 className="font-medium text-blue-900 mb-2">Revisar Projeto</h4>
                  <p className="text-sm text-blue-700">
                    Clique em "Revisar Projeto" para verificar detalhes, objetivos e requisitos
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                  <div className="w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                    2
                  </div>
                  <h4 className="font-medium text-yellow-900 mb-2">Tomar Decisão</h4>
                  <p className="text-sm text-yellow-700">
                    Aprove o projeto se atender aos critérios ou rejeite com feedback
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                    3
                  </div>
                  <h4 className="font-medium text-green-900 mb-2">Assinar Documento</h4>
                  <p className="text-sm text-green-700">
                    Após aprovação, você será redirecionado para assinar o documento oficial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
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
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedProject(null);
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
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirmar Rejeição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
