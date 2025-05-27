'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetos,
  useSubmitProjeto,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { apiClient } from '@/utils/api-client';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  Clock,
  Download,
  FileSignature,
  Send,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/pending-signatures',
)({
  component: PendingSignaturesComponent,
});

function PendingSignaturesComponent() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const uploadDocument = useUploadProjetoDocument();
  const submitProjeto = useSubmitProjeto();

  const [selectedFiles, setSelectedFiles] = useState<{
    [key: number]: File | null;
  }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Filter projects that need professor action (SUBMITTED status)
  const pendingProjetos =
    projetos?.filter((projeto) => projeto.status === 'SUBMITTED') || [];

  const handleDownloadPDFForSigning = async (
    projetoId: number,
    titulo: string,
  ) => {
    try {
      const response = await apiClient.get(
        `/projeto/${projetoId}/pdf?download=true`,
      );

      if (response.headers['x-download-pdf']) {
        // Handle HTML response for PDF generation
        const htmlContent = response.data;

        // Use html2pdf to convert HTML to PDF and download
        const html2pdf = (await import('html2pdf.js' as any)).default;

        const opt = {
          margin: 15,
          filename: `projeto-monitoria-${titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };

        html2pdf().set(opt).from(htmlContent).save();
        toast.success('PDF gerado e baixado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao gerar PDF do projeto');
    }
  };

  const handleDownloadAdminSignedPDF = async (
    projetoId: number,
    titulo: string,
  ) => {
    try {
      // Try to get the admin-signed document first
      const documentsResponse = await apiClient.get(
        `/projeto/${projetoId}/documents`,
      );
      const adminSignedDoc = documentsResponse.data.find(
        (doc: any) => doc.tipoDocumento === 'PROPOSTA_ASSINADA_ADMIN',
      );

      if (adminSignedDoc) {
        // Download the admin-signed document
        const response = await apiClient.get(
          `/files/access/${adminSignedDoc.fileId}`,
          {
            responseType: 'blob',
          },
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `projeto-assinado-admin-${titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Documento assinado pelo admin baixado com sucesso!');
      } else {
        // Fallback to regular PDF if admin-signed not found
        const response = await apiClient.get(`/projeto/${projetoId}/pdf`);

        const htmlContent = response.data;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();

          setTimeout(() => {
            newWindow.print();
          }, 500);

          toast.success('Documento aberto para impressão/download!');
        } else {
          toast.error('Popup bloqueado. Permita popups para baixar o PDF.');
        }
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento do projeto');
    }
  };

  const handleFileSelect = (projetoId: number, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [projetoId]: file,
    }));
  };

  const handleUploadSignedDocument = async (projetoId: number) => {
    const file = selectedFiles[projetoId];
    if (!file) {
      toast.error('Selecione um arquivo PDF assinado');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        projetoId,
        file,
        tipoDocumento: 'PROPOSTA_ASSINADA_PROFESSOR',
        observacoes: 'Documento assinado pelo professor responsável',
      });

      toast.success('Documento assinado enviado com sucesso!');

      // Clear the selected file and reset input
      setSelectedFiles((prev) => ({
        ...prev,
        [projetoId]: null,
      }));

      if (fileInputRefs.current[projetoId]) {
        fileInputRefs.current[projetoId]!.value = '';
      }

      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar documento assinado');
    }
  };

  const handleSubmitForApproval = async (projetoId: number) => {
    try {
      await submitProjeto.mutateAsync(projetoId);
      toast.success('Projeto submetido para aprovação final!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao submeter projeto para aprovação');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PROFESSOR_SIGNATURE':
        return <Badge variant="warning">Aguardando Sua Assinatura</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default">Submetido para Aprovação</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (user?.role !== 'professor') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Apenas professores podem acessar esta página.
          </p>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Assinaturas Pendentes"
      subtitle="Gerencie projetos que aguardam sua assinatura após aprovação administrativa"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando projetos...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Projetos Aguardando Sua Assinatura
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
                  Nenhum projeto aguardando assinatura
                </h3>
                <p>
                  Todos os seus projetos foram processados ou não há projetos
                  pendentes.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProjetos.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">
                        {projeto.titulo}
                      </TableCell>
                      <TableCell>{projeto.departamentoNome}</TableCell>
                      <TableCell>
                        {projeto.ano}.
                        {projeto.semestre === 'SEMESTRE_1' ? 1 : 2}
                      </TableCell>
                      <TableCell>{renderStatusBadge(projeto.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Download PDF for Signing Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadPDFForSigning(
                                projeto.id,
                                projeto.titulo,
                              )
                            }
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF para Assinatura
                          </Button>

                          {/* File Upload Section */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`file-${projeto.id}`}
                              className="text-xs"
                            >
                              Sua Assinatura (PDF)
                            </Label>
                            <Input
                              id={`file-${projeto.id}`}
                              type="file"
                              accept=".pdf"
                              ref={(el) => {
                                fileInputRefs.current[projeto.id] = el;
                              }}
                              onChange={(e) =>
                                handleFileSelect(
                                  projeto.id,
                                  e.target.files ? e.target.files[0] : null,
                                )
                              }
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUploadSignedDocument(projeto.id)
                              }
                              disabled={
                                !selectedFiles[projeto.id] ||
                                uploadDocument.isPending
                              }
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              {uploadDocument.isPending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Enviar Assinado
                                </>
                              )}
                            </Button>

                            {/* Submit for Final Approval */}
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSubmitForApproval(projeto.id)
                              }
                              disabled={submitProjeto.isPending}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {submitProjeto.isPending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Submetendo...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Submeter para Aprovação
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Processo de Assinatura do Professor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p>
              Baixe o PDF do projeto para assinar usando "Baixar PDF para
              Assinatura"
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p>Assine o documento fisicamente ou digitalmente</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <p>
              Faça upload do documento com sua assinatura usando "Enviar
              Assinado"
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>
              Clique em "Submeter para Aprovação" para enviar o projeto para
              aprovação final
            </p>
          </div>
        </CardContent>
      </Card>
    </PagesLayout>
  );
}
