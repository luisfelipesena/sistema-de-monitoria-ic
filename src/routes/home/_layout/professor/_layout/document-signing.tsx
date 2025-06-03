'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PdfViewerWithSignature } from '@/components/ui/pdf-viewer-with-signature';
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetos,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  FileSignature,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/document-signing',
)({
  component: ProfessorDocumentSigningComponent,
});

function ProfessorDocumentSigningComponent() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const uploadDocument = useUploadProjetoDocument();
  const [signingProject, setSigningProject] = useState<number | null>(null);

  // Filter projects that need professor signature
  // In the current flow, professors don't need to sign separately
  // This page is kept for future use if needed
  const projectsNeedingSignature = projetos?.filter((projeto) => {
    // Currently, professors sign when they submit the project
    // This could be used in the future for a separate signing step
    return false; // Disabled for now as per current workflow
  }) || [];

  const handleSignComplete = async (projetoId: number, signedPdfBlob: Blob) => {
    setSigningProject(projetoId);
    try {
      // Convert Blob to File
      const signedFile = new File(
        [signedPdfBlob], 
        `projeto_${projetoId}_assinado_professor.pdf`, 
        { type: 'application/pdf' }
      );

      // Upload the signed document
      await uploadDocument.mutateAsync({
        projetoId,
        file: signedFile,
        tipoDocumento: 'PROPOSTA_ASSINADA_PROFESSOR',
        observacoes: 'Documento assinado digitalmente pelo professor',
      });

      toast.success(
        'Documento assinado com sucesso! Aguardando assinatura do administrador.',
      );

      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar documento assinado');
    } finally {
      setSigningProject(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'PENDING_ADMIN_SIGNATURE':
        return <Badge variant="secondary">Aguardando Assinatura Admin</Badge>;
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
      title="Assinatura de Documentos - Professor"
      subtitle="Assine digitalmente seus projetos aprovados"
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
              {projectsNeedingSignature.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {projectsNeedingSignature.length} projeto(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsNeedingSignature.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum projeto aguardando assinatura
                </h3>
                <p>
                  Todos os seus projetos foram assinados ou não há projetos
                  aprovados aguardando sua assinatura.
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
                  {projectsNeedingSignature.map((projeto) => (
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
                        <PdfViewerWithSignature
                          pdfUrl={`/api/projeto/${projeto.id}/pdf`}
                          projectTitle={projeto.titulo}
                          onSignComplete={(blob) => handleSignComplete(projeto.id, blob)}
                          loading={signingProject === projeto.id}
                        />
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
          <CardTitle className="text-lg">Como Funciona a Assinatura Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p>Visualize o PDF do seu projeto aprovado</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p>Clique em "Assinar Digitalmente" para abrir o modal de assinatura</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <p>Desenhe sua assinatura e confirme</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>
              Após sua assinatura, o projeto será enviado para assinatura do administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </PagesLayout>
  );
}