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
import { InteractiveProjectPDF } from '@/components/features/projects/InteractiveProjectPDF';
import { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import { useAuth } from '@/hooks/use-auth';
import {
  useProjetos,
  useProjeto,
} from '@/hooks/use-projeto';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useDisciplinas } from '@/hooks/use-disciplina';
import { useProfessores } from '@/hooks/use-professor';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  FileSignature,
  Edit,
  Loader2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const searchSchema = z.object({
  projectId: z.number().optional(),
});

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/document-signing',
)({
  component: ProfessorDocumentSigningComponent,
  validateSearch: searchSchema,
});

function ProfessorDocumentSigningComponent() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const { data: departamentos } = useDepartamentoList();
  const { data: disciplinas } = useDisciplinas();
  const { data: professores } = useProfessores();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    search.projectId || null
  );
  
  const { data: selectedProject, isLoading: loadingProject } = useProjeto(
    selectedProjectId || 0
  );

  const projectsNeedingSignature = projetos?.filter((projeto) => {
    return (
      projeto.professorResponsavelId === user?.id &&
      (projeto.status === 'DRAFT' || projeto.status === 'PENDING_PROFESSOR_SIGNATURE')
    );
  }) || [];

  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!selectedProject || !departamentos || !professores) return null;

    const departamento = departamentos.find(d => d.id === selectedProject.departamento?.id);
    const professor = professores.find((p: any) => p.id === selectedProject.professorResponsavel?.id);

    return {
      titulo: selectedProject.titulo,
      descricao: selectedProject.descricao,
      departamento: departamento ? {
        id: departamento.id,
        nome: departamento.nome,
      } : undefined,
      professorResponsavel: professor ? {
        id: professor.id,
        nomeCompleto: professor.nomeCompleto,
        nomeSocial: professor.nomeSocial || undefined,
        genero: professor.genero,
        cpf: professor.cpf,
        matriculaSiape: professor.matriculaSiape || undefined,
        regime: professor.regime,
        telefone: professor.telefone || undefined,
        telefoneInstitucional: professor.telefoneInstitucional || undefined,
        emailInstitucional: professor.emailInstitucional,
      } : undefined,
      ano: selectedProject.ano,
      semestre: selectedProject.semestre,
      tipoProposicao: selectedProject.tipoProposicao,
      bolsasSolicitadas: selectedProject.bolsasSolicitadas,
      voluntariosSolicitados: selectedProject.voluntariosSolicitados,
      cargaHorariaSemana: selectedProject.cargaHorariaSemana,
      numeroSemanas: selectedProject.numeroSemanas,
      publicoAlvo: selectedProject.publicoAlvo,
      estimativaPessoasBenificiadas: selectedProject.estimativaPessoasBenificiadas ?? undefined,
      disciplinas: selectedProject.disciplinas?.map(pd => ({
        id: pd.disciplina.id,
        codigo: pd.disciplina.codigo,
        nome: pd.disciplina.nome,
      })) || [],
      user: {
        username: user?.username,
        email: user?.email,
        role: user?.role,
      },
      projetoId: selectedProject.id !== null ? selectedProject.id : undefined,
      assinaturaProfessor: selectedProject.assinaturaProfessor || undefined,
      dataAssinaturaProfessor: selectedProject.assinaturaProfessor ? new Date().toLocaleDateString('pt-BR') : undefined,
    };
  }, [selectedProject, departamentos, professores, user]);

  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  const handleSelectProject = (projetoId: number) => {
    setSelectedProjectId(projetoId);
  };

  const handleViewPDF = (projetoId: number) => {
    window.open(`/api/projeto/${projetoId}/pdf`, '_blank');
  };

  const handleSignatureComplete = () => {
    refetch();
    toast.success('Assinatura salva com sucesso!');
    setSelectedProjectId(null);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'PENDING_PROFESSOR_SIGNATURE':
        return <Badge variant="secondary">Aguardando Assinatura</Badge>;
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

  if (selectedProjectId && templateData) {
    return (
      <PagesLayout
        title="Assinatura de Projeto"
        subtitle={`Assine o projeto: ${templateData.titulo}`}
      >
        <div className="mb-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Button>
        </div>
        
        {loadingProject ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <InteractiveProjectPDF
            formData={templateData}
            userRole="professor"
            onSignatureComplete={handleSignatureComplete}
          />
        )}
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
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPDF(projeto.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver PDF
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleSelectProject(projeto.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Assinar e Submeter
                          </Button>
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
    </PagesLayout>
  );
}