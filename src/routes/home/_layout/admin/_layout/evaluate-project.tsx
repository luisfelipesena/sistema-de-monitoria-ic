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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveProjeto,
  useNotifyProfessorSigning,
  useProjetos,
  useRejectProjeto,
  useUpdateProjetoStatus,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import {
  Check,
  Download,
  Eye,
  FileSignature,
  FileText,
  Loader,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/evaluate-project',
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

interface DocumentSigningModalData {
  projetoId: number;
  titulo: string;
}

function AnaliseProjetosPage() {
  const {
    data: projetos,
    isLoading: loadingProjetos,
    refetch: refetchProjetos,
  } = useProjetos();
  const approveMutation = useApproveProjeto();
  const rejectMutation = useRejectProjeto();
  const uploadDocumentMutation = useUploadProjetoDocument();
  const updateStatusMutation = useUpdateProjetoStatus();
  const notifySigningMutation = useNotifyProfessorSigning();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData | null>(
    null,
  );
  const [rejectionModal, setRejectionModal] =
    useState<RejectionModalData | null>(null);
  const [documentSigningModal, setDocumentSigningModal] =
    useState<DocumentSigningModalData | null>(null);

  // Form data
  const [bolsasDisponibilizadas, setBolsasDisponibilizadas] =
    useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [documentObservacoes, setDocumentObservacoes] = useState<string>('');

  // Categorizar projetos por status
  const projetosSubmetidos =
    projetos?.filter((projeto) => projeto.status === 'SUBMITTED') || [];
  const projetosAprovados =
    projetos?.filter((projeto) => projeto.status === 'APPROVED') || [];
  const projetosRejeitados =
    projetos?.filter((projeto) => projeto.status === 'REJECTED') || [];
  const projetosParaAssinaturaAdmin =
    projetos?.filter((projeto) => projeto.status === 'DRAFT') || [];

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

      toast.success(
        'Projeto aprovado com sucesso! Professor será notificado para assinar o documento.',
      );
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

  const handleDownloadPDF = async (projetoId: number) => {
    try {
      const response = await fetch(`/api/projeto/${projetoId}/pdf`);
      if (!response.ok) throw new Error('Erro ao baixar PDF');

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');
      URL.revokeObjectURL(url);

      toast.success('PDF aberto para visualização');
    } catch (error) {
      toast.error('Erro ao baixar PDF do projeto');
    }
  };

  const handleUploadSignedDocument = async (file: File) => {
    if (!documentSigningModal) return;

    try {
      await uploadDocumentMutation.mutateAsync({
        projetoId: documentSigningModal.projetoId,
        file,
        observacoes: documentObservacoes,
        tipoDocumento: 'PROPOSTA_ASSINADA_ADMIN',
      });

      const signedProject = projetos?.find(
        (p) => p.id === documentSigningModal.projetoId,
      );
      if (signedProject && signedProject.status === 'DRAFT') {
        await updateStatusMutation.mutateAsync({
          projetoId: documentSigningModal.projetoId,
          status: 'PENDING_PROFESSOR_SIGNATURE',
        });
        toast.success(
          'Projeto atualizado para Aguardando Assinatura do Professor!',
        );
        refetchProjetos();

        // Notify the professor
        await notifySigningMutation.mutateAsync({
          projetoId: documentSigningModal.projetoId,
          message:
            'Um projeto aguarda sua assinatura após a assinatura do administrador.',
        });
        toast.info('Professor responsável notificado para assinar.');
      }

      // This toast confirms admin's document upload success
      toast.success('Documento assinado pelo admin enviado com sucesso!');

      setDocumentSigningModal(null);
      setDocumentObservacoes('');
    } catch (error) {
      toast.error('Erro ao enviar documento assinado');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            📝 Aguardando Análise
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            ✅ Aprovado - Aguardando Assinatura Professor
          </Badge>
        );
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">❌ Rejeitado</Badge>;
      case 'DRAFT':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            📄 Rascunho - Aguardando Assinatura Admin
          </Badge>
        );
      case 'PENDING_PROFESSOR_SIGNATURE':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            ✍️ Aguardando Assinatura Professor
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProjectActions = (projeto: ProjetoListItem) => {
    const baseActions = [
      <Button
        key="view"
        variant="outline"
        size="sm"
        className="rounded-full flex items-center gap-1"
        onClick={() => {
          router.navigate({
            to: '/home/admin/$project',
            params: { project: projeto.id.toString() },
          });
        }}
      >
        <Eye className="h-4 w-4" />
        Ver
      </Button>,
    ];

    if (projeto.status === 'SUBMITTED') {
      return [
        ...baseActions,
        <Button
          key="download"
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleDownloadPDF(projeto.id)}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>,
        <Button
          key="approve"
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1 bg-green-600 hover:bg-green-700"
          onClick={() => {
            setApprovalModal({
              projetoId: projeto.id,
              titulo: projeto.titulo,
              bolsasSolicitadas: projeto.bolsasSolicitadas,
            });
            setBolsasDisponibilizadas(projeto.bolsasSolicitadas);
          }}
        >
          <Check className="h-4 w-4" />
          Aprovar
        </Button>,
        <Button
          key="reject"
          variant="destructive"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => {
            setRejectionModal({
              projetoId: projeto.id,
              titulo: projeto.titulo,
            });
          }}
        >
          <X className="h-4 w-4" />
          Rejeitar
        </Button>,
      ];
    }

    if (projeto.status === 'APPROVED') {
      return [
        ...baseActions,
        <Button
          key="download"
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleDownloadPDF(projeto.id)}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>,
        <Button
          key="sign"
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setDocumentSigningModal({
              projetoId: projeto.id,
              titulo: projeto.titulo,
            });
          }}
        >
          <FileSignature className="h-4 w-4" />
          Assinar (Admin)
        </Button>,
      ];
    }

    if (projeto.status === 'DRAFT') {
      return [
        ...baseActions,
        <Button
          key="download-draft"
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleDownloadPDF(projeto.id)}
        >
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>,
        <Button
          key="sign-draft-admin"
          variant="primary"
          size="sm"
          className="rounded-full flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            setDocumentSigningModal({
              projetoId: projeto.id,
              titulo: projeto.titulo,
            });
          }}
        >
          <FileSignature className="h-4 w-4" />
          Upload Assinatura Admin
        </Button>,
      ];
    }

    if (projeto.status === 'PENDING_PROFESSOR_SIGNATURE') {
      return [
        ...baseActions,
        <Button
          key="download-pending-prof"
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleDownloadPDF(projeto.id)}
        >
          <Download className="h-4 w-4" />
          Ver PDF Assinado (Admin)
        </Button>,
      ];
    }

    return baseActions;
  };

  const createColumns = (
    includeActions = true,
  ): ColumnDef<ProjetoListItem>[] => {
    const baseColumns: ColumnDef<ProjetoListItem>[] = [
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
          <span className="text-sm">
            {row.original.professorResponsavelNome}
          </span>
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
        header: 'Bolsas',
        accessorKey: 'bolsasSolicitadas',
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">
              {row.original.bolsasSolicitadas}
            </span>
            {row.original.bolsasDisponibilizadas !== null && (
              <p className="text-xs text-green-600">
                Disp: {row.original.bolsasDisponibilizadas}
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Voluntários',
        accessorKey: 'voluntariosSolicitados',
        cell: ({ row }) => (
          <span className="font-medium text-center">
            {row.original.voluntariosSolicitados}
          </span>
        ),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
    ];

    if (includeActions) {
      baseColumns.push({
        header: 'Ações',
        accessorKey: 'acoes',
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {getProjectActions(row.original)}
          </div>
        ),
      });
    }

    return baseColumns;
  };

  return (
    <PagesLayout
      title="Análise de Projetos"
      subtitle="Gerencie o fluxo completo de aprovação e assinatura"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : (
        <Tabs defaultValue="para-assinatura-admin" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="para-assinatura-admin"
              className="flex items-center gap-2"
            >
              🔒 Para Minha Assinatura ({projetosParaAssinaturaAdmin.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              📝 Para Análise ({projetosSubmetidos.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              ✅ Para Assinatura ({projetosAprovados.length})
            </TabsTrigger>
            <TabsTrigger
              value="pending-professor"
              className="flex items-center gap-2"
            >
              ✍️ Aguardando Prof. (
              {projetos?.filter(
                (p) => p.status === 'PENDING_PROFESSOR_SIGNATURE',
              ).length || 0}
              )
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              📋 Finalizados ({projetosRejeitados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="para-assinatura-admin" className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">
                🔒 Projetos Aguardando Sua Assinatura (Admin)
              </h3>
              <p className="text-sm text-indigo-700">
                Estes projetos foram criados e aguardam sua assinatura (Admin)
                antes de serem enviados para aprovação ou para assinatura do
                professor. Gere o PDF, assine e faça o upload do documento
                assinado.
              </p>
            </div>
            {projetosParaAssinaturaAdmin.length === 0 ? (
              <div className="text-center py-8">
                <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum projeto aguardando sua assinatura (Admin).
                </p>
              </div>
            ) : (
              <TableComponent
                columns={createColumns()}
                data={projetosParaAssinaturaAdmin}
              />
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📝 Projetos Aguardando Análise
              </h3>
              <p className="text-sm text-blue-700">
                Estes projetos foram submetidos pelos professores e aguardam sua
                aprovação ou rejeição.
              </p>
            </div>
            {projetosSubmetidos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum projeto aguardando análise
                </p>
              </div>
            ) : (
              <TableComponent
                columns={createColumns()}
                data={projetosSubmetidos}
              />
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Projetos Aguardando Assinatura
              </h3>
              <p className="text-sm text-green-700">
                Estes projetos foram aprovados e aguardam o ciclo de assinatura.
                Baixe o PDF, assine e faça upload do documento assinado.
              </p>
            </div>
            {projetosAprovados.length === 0 ? (
              <div className="text-center py-8">
                <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum projeto aguardando assinatura
                </p>
              </div>
            ) : (
              <TableComponent
                columns={createColumns()}
                data={projetosAprovados}
              />
            )}
          </TabsContent>

          <TabsContent value="pending-professor" className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">
                ✍️ Projetos Aguardando Assinatura do Professor
              </h3>
              <p className="text-sm text-purple-700">
                Estes projetos foram assinados por você (Admin) e agora aguardam
                a assinatura do professor responsável.
              </p>
            </div>
            {(projetos?.filter(
              (p) => p.status === 'PENDING_PROFESSOR_SIGNATURE',
            ).length || 0) === 0 ? (
              <div className="text-center py-8">
                <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum projeto aguardando assinatura do professor.
                </p>
              </div>
            ) : (
              <TableComponent
                columns={createColumns()}
                data={
                  projetos?.filter(
                    (p) => p.status === 'PENDING_PROFESSOR_SIGNATURE',
                  ) || []
                }
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                📋 Projetos Finalizados
              </h3>
              <p className="text-sm text-gray-700">
                Projetos que foram rejeitados ou que completaram todo o ciclo de
                aprovação e assinatura.
              </p>
            </div>
            {projetosRejeitados.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum projeto finalizado</p>
              </div>
            ) : (
              <TableComponent
                columns={createColumns(false)}
                data={projetosRejeitados}
              />
            )}
          </TabsContent>
        </Tabs>
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

      {/* Modal de Assinatura de Documento */}
      <Dialog
        open={!!documentSigningModal}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentSigningModal(null);
            setDocumentObservacoes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Documento do Projeto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="font-medium">Projeto:</Label>
              <p className="text-sm text-gray-700">
                {documentSigningModal?.titulo}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Baixe o PDF do projeto usando o botão "PDF"</li>
                <li>Assine digitalmente o documento</li>
                <li>Faça upload do documento assinado abaixo</li>
              </ol>
            </div>

            <div>
              <Label htmlFor="document-upload">
                Documento Assinado (PDF) *
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadSignedDocument(file);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo PDF
              </Button>
            </div>

            <div>
              <Label htmlFor="documentObservacoes">
                Observações (opcional)
              </Label>
              <Textarea
                id="documentObservacoes"
                value={documentObservacoes}
                onChange={(e) => setDocumentObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a assinatura..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDocumentSigningModal(null)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
