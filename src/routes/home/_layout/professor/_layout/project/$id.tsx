import { ProjectSignaturePad } from '@/components/features/projects/ProjectSignaturePad';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetoById,
  useSaveProjectSignature,
  useSubmitProjeto,
} from '@/hooks/use-projeto';
import { useToast } from '@/hooks/use-toast';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle, FileText, Send } from 'lucide-react';
import { z } from 'zod';

export const Route = createFileRoute('/home/_layout/professor/_layout/project/$id')({
  component: ProfessorProjectDetailsPage,
  parseParams: (params) => ({
    id: z.string().parse(params.id),
  }),
});

function ProfessorProjectDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const projectId = parseInt(id, 10);

  const { data: projeto, isLoading, error } = useProjetoById(projectId);
  const saveSignatureMutation = useSaveProjectSignature();
  const submitMutation = useSubmitProjeto();

  const handleSaveSignature = (signature: string) => {
    saveSignatureMutation.mutate(
      { id: projectId, signatureImage: signature },
      {
        onSuccess: () => {
          toast({
            title: 'Assinatura Salva!',
            description: 'Sua assinatura foi salva com sucesso.',
          });
        },
        onError: (err) => {
          toast({
            title: 'Erro ao Salvar Assinatura',
            description:
              err.message || 'Não foi possível salvar a assinatura.',
            variant: 'destructive',
          });
        },
      },
    );
  };
  
  const handleSubmitProject = () => {
    submitMutation.mutate(
      { id: projectId },
      {
        onSuccess: () => {
          toast({
            title: 'Projeto Submetido!',
            description: 'Seu projeto foi enviado para avaliação dos administradores.',
          });
          navigate({ to: '/home/professor/dashboard' });
        },
        onError: (err) => {
          toast({
            title: 'Erro ao Submeter',
            description:
              err.message || 'Não foi possível submeter o projeto.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PagesLayout title="Detalhes do Projeto">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    );
  }

  if (error || !projeto) {
    return (
      <PagesLayout title="Erro">
        <p>
          {error?.message ||
            'Não foi possível carregar os detalhes do projeto.'}
        </p>
      </PagesLayout>
    );
  }

  const isOwner = projeto.professorResponsavel.userId === Number(user?.id);
  const showSignaturePad = projeto.status === 'DRAFT' && isOwner && !projeto.assinaturaProfessor;
  const showSubmitButton = projeto.status === 'DRAFT' && isOwner && projeto.assinaturaProfessor;
  
  return (
    <PagesLayout
      title="Detalhes do Projeto"
      subtitle={`#${projeto.id} - ${projeto.titulo}`}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Informações Gerais
              <Badge>{projeto.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display other project details here */}
            <p><strong>Departamento:</strong> {projeto.departamento.nome}</p>
            <p><strong>Professor Responsável:</strong> {projeto.professorResponsavel.nomeCompleto}</p>
          </CardContent>
        </Card>

        {showSignaturePad && (
            <ProjectSignaturePad onSave={handleSaveSignature} isSaving={saveSignatureMutation.isPending} />
        )}

        {projeto.assinaturaProfessor && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Projeto Assinado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <img src={projeto.assinaturaProfessor} alt="Assinatura" className="border rounded-md" />
                    <p className="text-sm text-muted-foreground mt-2">
                        Este projeto foi assinado digitalmente pelo professor responsável.
                    </p>
                </CardContent>
             </Card>
        )}

        {showSubmitButton && (
            <div className="text-center mt-6">
                <Button size="lg" onClick={handleSubmitProject} disabled={submitMutation.isPending}>
                    <Send className="mr-2 h-4 w-4" />
                    {submitMutation.isPending ? 'Submetendo Projeto...' : 'Submeter Projeto para Avaliação'}
                </Button>
            </div>
        )}
      </div>
    </PagesLayout>
  );
} 