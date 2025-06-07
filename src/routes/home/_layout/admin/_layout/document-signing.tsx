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
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useProfessores } from '@/hooks/use-professor';
import {
  useProjetos,
  useProjeto,
  useUpdateProjetoStatus,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle,
  FileSignature,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/document-signing',
)({
  component: DocumentSigningComponent,
});

function DocumentSigningComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projetos, isLoading: loadingProjetos, refetch } = useProjetos();
  const { data: departamentos } = useDepartamentoList();
  const { data: professores } = useProfessores();
  const uploadDocument = useUploadProjetoDocument();
  const updateStatus = useUpdateProjetoStatus();
  const [signingProject, setSigningProject] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: selectedProject, isLoading: loadingProject } = useProjeto(
    selectedProjectId || 0
  );

  // Filter projects that are PENDING_ADMIN_SIGNATURE (approved but need signing)
  const pendingSignatureProjetos =
    projetos?.filter((projeto) => projeto.status === 'PENDING_ADMIN_SIGNATURE') || [];

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
      coordenadorResponsavel: user?.username || 'Coordenador',
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
        nomeCompleto: user?.username,
        role: user?.role,
      },
      projetoId: selectedProject.id !== null ? selectedProject.id : undefined,
      assinaturaProfessor: selectedProject.assinaturaProfessor || undefined,
      dataAprovacao: selectedProject.status === 'APPROVED' ? new Date().toLocaleDateString('pt-BR') : undefined,
    };
  }, [selectedProject, departamentos, professores, user]);

  const handleBackToDashboard = () => {
    navigate({ to: '/home/admin/dashboard' });
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  const handleSignComplete = () => {
    refetch();
    toast.success('Projeto assinado com sucesso!');
    setSelectedProjectId(null);
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

  // Show signing interface if a project is selected
  if (selectedProjectId && templateData) {
    return (
      <PagesLayout
        title="Assinatura de Projeto - Admin"
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
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Carregando projeto...</p>
            </div>
          </div>
        ) : (
          <InteractiveProjectPDF
            formData={templateData}
            userRole="admin"
            onSignatureComplete={handleSignComplete}
          />
        )}
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Assinatura de Documentos - Admin"
      subtitle="Gerencie projetos de monitoria que aguardam assinatura administrativa"
    >
      <div className="mb-4">
        <Button variant="outline" onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

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
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedProjectId(projeto.id)}
                        >
                          <FileSignature className="h-4 w-4 mr-2" />
                          Assinar Projeto
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
            <p>Visualize o PDF do projeto clicando em "Visualizar PDF"</p>
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
            <p>Desenhe sua assinatura e clique em "Assinar Documento"</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>
              O documento será automaticamente assinado e o projeto aprovado
            </p>
          </div>
        </CardContent>
      </Card>
    </PagesLayout>
  );
}
