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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetos,
  useUpdateProjetoStatus,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  Eye,
  FileSignature,
  FileText,
  Loader,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/pending-signs',
)({
  component: ProfessorAssinaturasPage,
});

interface DocumentSigningModalData {
  projetoId: number;
  titulo: string;
}

function ProfessorAssinaturasPage() {
  const { user } = useAuth();
  const {
    data: todosProjetos,
    isLoading: loadingProjetos,
    refetch: refetchProjetos,
  } = useProjetos();
  const uploadDocumentMutation = useUploadProjetoDocument();
  const updateStatusMutation = useUpdateProjetoStatus();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentSigningModal, setDocumentSigningModal] =
    useState<DocumentSigningModalData | null>(null);
  const [documentObservacoes, setDocumentObservacoes] = useState<string>('');

  const [projetosParaAssinaturaProfessor, setProjetosParaAssinaturaProfessor] =
    useState<ProjetoListItem[]>([]);

  useEffect(() => {
    if (todosProjetos && user) {
      const filtered = todosProjetos.filter(
        (projeto) =>
          projeto.status === 'PENDING_PROFESSOR_SIGNATURE' &&
          projeto.professorResponsavelNome === user.username, // Basic check, ideally use professorId
        // TODO: Backend should filter by professorResponsavelId based on authenticated user
      );
      setProjetosParaAssinaturaProfessor(filtered);
    }
  }, [todosProjetos, user]);

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

  const handleUploadProfessorSignedDocument = async (file: File) => {
    if (!documentSigningModal) return;

    try {
      await uploadDocumentMutation.mutateAsync({
        projetoId: documentSigningModal.projetoId,
        file,
        tipoDocumento: 'PROPOSTA_ASSINADA_PROFESSOR',
        observacoes: documentObservacoes,
      });

      // After professor signs, update status to SUBMITTED (ready for admin final review/opening)
      await updateStatusMutation.mutateAsync({
        projetoId: documentSigningModal.projetoId,
        status: 'SUBMITTED',
      });

      toast.success(
        'Documento assinado enviado com sucesso! Projeto submetido para análise final.',
      );
      setDocumentSigningModal(null);
      setDocumentObservacoes('');
      refetchProjetos(); // Refetch to update the list
    } catch (error) {
      toast.error('Erro ao enviar documento assinado');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING_PROFESSOR_SIGNATURE') {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          ✍️ Aguardando Sua Assinatura
        </Badge>
      );
    }
    // Add other statuses if this page ever shows them
    return <Badge variant="outline">{status}</Badge>;
  };

  const getProjectActions = (project: ProjetoListItem) => {
    return [
      <Button
        key="view"
        variant="outline"
        size="sm"
        className="rounded-full flex items-center gap-1"
        onClick={() => {
          router.navigate({
            to: '/home/admin/$project',
            params: { project: project.id.toString() },
          });
        }}
      >
        <Eye className="h-4 w-4" />
        Ver Detalhes
      </Button>,
      <Button
        key="download"
        variant="secondary"
        size="sm"
        className="rounded-full flex items-center gap-1"
        onClick={() => handleDownloadPDF(project.id)}
      >
        <Download className="h-4 w-4" />
        Baixar PDF (Admin Assinado)
      </Button>,
      <Button
        key="sign-professor"
        variant="primary"
        size="sm"
        className="rounded-full flex items-center gap-1 bg-green-600 hover:bg-green-700"
        onClick={() => {
          setDocumentSigningModal({
            projetoId: project.id,
            titulo: project.titulo,
          });
        }}
      >
        <FileSignature className="h-4 w-4" />
        Upload Minha Assinatura
      </Button>,
    ];
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
      header: 'Admin Criador/Responsável', // Assuming admin initiated or last modified
      accessorKey: 'professorResponsavelNome', // This might need adjustment based on actual data
      cell: ({ row }) => (
        // Placeholder - ideally show who from admin side handled it
        <span className="text-sm">Admin</span>
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
      header: 'Ações',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {getProjectActions(row.original)}
        </div>
      ),
    },
  ];

  return (
    <PagesLayout
      title="Assinaturas Pendentes"
      subtitle="Projetos aguardando sua assinatura como professor responsável"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : (
        <>
          {projetosParaAssinaturaProfessor.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum projeto pendente</h3>
              <p className="text-muted-foreground">
                Você não tem projetos aguardando sua assinatura no momento.
              </p>
            </div>
          ) : (
            <TableComponent
              columns={columns}
              data={projetosParaAssinaturaProfessor}
            />
          )}
        </>
      )}

      {/* Modal de Assinatura de Documento (Professor) */}
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
            <DialogTitle>Enviar Documento Assinado (Professor)</DialogTitle>
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
                <li>Baixe o PDF do projeto (já assinado pelo admin).</li>
                <li>Assine digitalmente o documento.</li>
                <li>Faça upload do documento assinado abaixo.</li>
              </ol>
            </div>
            <div>
              <Label htmlFor="document-upload-professor">
                Seu Documento Assinado (PDF) *
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                id="document-upload-professor"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadProfessorSignedDocument(file);
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
                Selecionar Arquivo PDF Assinado
              </Button>
            </div>
            <div>
              <Label htmlFor="documentObservacoesProfessor">
                Observações (opcional)
              </Label>
              <Textarea
                id="documentObservacoesProfessor"
                value={documentObservacoes}
                onChange={(e) => setDocumentObservacoes(e.target.value)}
                placeholder="Adicione observações sobre sua assinatura..."
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
