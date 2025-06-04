'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// import { PdfViewerWithSignature } from '@/components/ui/pdf-viewer-with-signature'; // To be removed
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetos,
  useProjectProfessorSignature, // New hook
  // useUploadProjetoDocument, // To be removed if only used by old flow
} from '@/hooks/use-projeto';
import { ProjetoListItem } from '@/routes/api/projeto/-types'; // For typing projectToSign
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  FileSignature,
  Edit,
  Loader2
} from 'lucide-react';
import { useState, useRef } from 'react'; // Removed useEffect as it's not used
import SignatureCanvas from 'react-signature-canvas'; // New import
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'; // For the new signature modal

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/document-signing',
)({
  component: ProfessorDocumentSigningComponent,
});

function ProfessorDocumentSigningComponent() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  // const uploadDocument = useUploadProjetoDocument(); // Remove if not used elsewhere
  const projectSignatureMutation = useProjectProfessorSignature();

  const [projectToSign, setProjectToSign] = useState<ProjetoListItem | null>(null);
  const sigPad = useRef<SignatureCanvas>(null);

  const projectsNeedingSignature = projetos?.filter((projeto) => {
    return (
      projeto.professorResponsavelId === user?.id &&
      (projeto.status === 'DRAFT' || projeto.status === 'PENDING_PROFESSOR_SIGNATURE')
    );
  }) || [];

  const handleOpenSignatureModal = (projeto: ProjetoListItem) => {
    setProjectToSign(projeto);
  };

  const handleClearSignature = () => {
    sigPad.current?.clear();
  };

  const handleSubmitSignature = async () => {
    if (!projectToSign || !sigPad.current) return;

    if (sigPad.current.isEmpty()) {
      toast.error('Por favor, forneça sua assinatura.');
      return;
    }

    const assinaturaData = sigPad.current.toDataURL('image/png');

    projectSignatureMutation.mutate(
      { projetoId: projectToSign.id, assinaturaData },
      {
        onSuccess: () => {
          toast.success('Projeto assinado e submetido com sucesso!');
          setProjectToSign(null);
          sigPad.current?.clear(); // Clear signature after successful submission
      refetch();
        },
        onError: (error) => {
          toast.error(error.message || 'Erro ao submeter assinatura.');
        },
      },
    );
  };

  // ... (renderStatusBadge can be kept or simplified if status display changes)
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'PENDING_PROFESSOR_SIGNATURE':
        return <Badge variant="secondary">Aguardando Assinatura</Badge>;
      // Add other relevant statuses if needed
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
      title="Assinatura de Projetos - Professor"
      subtitle="Assine e submeta seus projetos de monitoria."
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Projetos Aguardando Sua Assinatura/Submissão
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
                  Nenhum projeto aguardando sua ação
                </h3>
                <p>
                  Todos os seus projetos que requerem assinatura foram processados ou não há projetos pendentes.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
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
                      <TableCell>{renderStatusBadge(projeto.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm"
                          onClick={() => handleOpenSignatureModal(projeto)}
                          disabled={projectSignatureMutation.isPending && projectSignatureMutation.variables?.projetoId === projeto.id}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Assinar e Submeter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {projectToSign && (
        <Dialog open={!!projectToSign} onOpenChange={(isOpen) => {
          if (!isOpen) setProjectToSign(null);
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Assinar Projeto: {projectToSign.titulo}</DialogTitle>
              <DialogDescription>
                Desenhe sua assinatura no campo abaixo. Esta ação submeterá o projeto.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SignatureCanvas
                ref={sigPad}
                canvasProps={{
                  className: 'border rounded-md w-full h-48 bg-white',
                }}
              />
          </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={handleClearSignature} disabled={projectSignatureMutation.isPending}>
                Limpar
              </Button>
              <DialogClose asChild>
                 <Button variant="outline" onClick={() => setProjectToSign(null)} disabled={projectSignatureMutation.isPending}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmitSignature} disabled={projectSignatureMutation.isPending}>
                {projectSignatureMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando...
                  </>
                ) : (
                  'Confirmar Assinatura e Submeter'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove old Instructions Card if it refers to PDF signing */}
    </PagesLayout>
  );
}