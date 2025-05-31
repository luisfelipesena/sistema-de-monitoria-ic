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
  useUpdateProjetoStatus,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { apiClient } from '@/utils/api-client';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  Clock,
  Download,
  FileSignature,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/document-signing',
)({
  component: DocumentSigningComponent,
});

function DocumentSigningComponent() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const uploadDocument = useUploadProjetoDocument();
  const updateStatus = useUpdateProjetoStatus();

  const [selectedFiles, setSelectedFiles] = useState<{
    [key: number]: File | null;
  }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Filter projects that are PENDING_ADMIN_SIGNATURE (approved but need signing)
  const pendingSignatureProjetos =
    projetos?.filter((projeto) => projeto.status === 'PENDING_ADMIN_SIGNATURE') || [];

  const handleDownloadPDF = async (projetoId: number, titulo: string) => {
    try {
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
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast.error('Erro ao abrir documento do projeto');
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
        tipoDocumento: 'PROPOSTA_ASSINADA_ADMIN',
        observacoes: 'Documento assinado pelo administrador',
      });

      // Update project status to APPROVED after admin signs
      await updateStatus.mutateAsync({
        projetoId,
        status: 'APPROVED',
      });

      toast.success(
        'Documento assinado enviado! Projeto aprovado com sucesso.',
      );

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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ADMIN_SIGNATURE':
        return <Badge variant="secondary">Aguardando Assinatura Admin</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default">Submetido</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
      title="Assinatura de Documentos - Admin"
      subtitle="Gerencie projetos de monitoria que aguardam assinatura administrativa"
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
              Projetos Aguardando Assinatura Administrativa
              {pendingSignatureProjetos.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {pendingSignatureProjetos.length} projeto(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSignatureProjetos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum projeto aguardando assinatura
                </h3>
                <p>
                  Todos os projetos foram processados ou não há projetos
                  aprovados aguardando assinatura.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Professor Responsável</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSignatureProjetos.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">
                        {projeto.titulo}
                      </TableCell>
                      <TableCell>{projeto.departamentoNome}</TableCell>
                      <TableCell>{projeto.professorResponsavelNome}</TableCell>
                      <TableCell>
                        {projeto.ano}.
                        {projeto.semestre === 'SEMESTRE_1' ? 1 : 2}
                      </TableCell>
                      <TableCell>{renderStatusBadge(projeto.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {/* Download PDF Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadPDF(projeto.id, projeto.titulo)
                            }
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Visualizar/Imprimir
                          </Button>

                          {/* File Upload Section */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`file-${projeto.id}`}
                              className="text-xs"
                            >
                              Documento Assinado (PDF)
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
                                uploadDocument.isPending ||
                                updateStatus.isPending
                              }
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {uploadDocument.isPending ||
                              updateStatus.isPending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Processando...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Enviar Assinado
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
          <CardTitle className="text-lg">Como Funciona o Processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p>Baixe o PDF do projeto usando o botão "Baixar PDF"</p>
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
            <p>Faça upload do documento assinado usando "Enviar Assinado"</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>
              O projeto será automaticamente liberado para assinatura do
              professor responsável
            </p>
          </div>
        </CardContent>
      </Card>
    </PagesLayout>
  );
}
