'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useProjetos } from '@/hooks/use-projeto';
import {
  AvaliacaoStatus,
  useBulkEvaluation,
  useSelectionProcess,
} from '@/hooks/use-selection-process';
import { createFileRoute } from '@tanstack/react-router';
import {
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Star,
  Users,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const searchSchema = z.object({
  projectId: z.number().optional(),
});

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/project-applications',
)({
  component: ProjectApplicationsPage,
  validateSearch: searchSchema,
});

interface QuickEvaluation {
  inscricaoId: number;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  decision: 'SELECT_SCHOLARSHIP' | 'SELECT_VOLUNTEER' | 'REJECT' | 'PENDING';
}

function ProjectApplicationsPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    search.projectId || null,
  );
  const [quickEvaluations, setQuickEvaluations] = useState<
    Record<number, QuickEvaluation>
  >({});

  const { data: selectionData, isLoading: loadingSelection } =
    useSelectionProcess(selectedProjectId || 0);
  const bulkEvaluation = useBulkEvaluation();

  // Auto-select project if coming from dashboard
  useEffect(() => {
    if (search.projectId && search.projectId !== selectedProjectId) {
      setSelectedProjectId(search.projectId);
    }
  }, [search.projectId, selectedProjectId]);

  // Filter projects that are approved and belong to the current professor
  const myApprovedProjects = useMemo(() => {
    if (!projetos) return [];
    return projetos.filter((projeto) => projeto.status === 'APPROVED');
  }, [projetos]);

  const selectedProject = myApprovedProjects.find(
    (p) => p.id === selectedProjectId,
  );

  const candidatesByType = useMemo(() => {
    if (!selectionData?.candidatos) return { scholarship: [], volunteer: [] };

    const scholarship = selectionData.candidatos.filter(
      (c) =>
        c.tipoVagaPretendida === 'BOLSISTA' || c.tipoVagaPretendida === 'ANY',
    );

    const volunteer = selectionData.candidatos.filter(
      (c) =>
        c.tipoVagaPretendida === 'VOLUNTARIO' || c.tipoVagaPretendida === 'ANY',
    );

    return { scholarship, volunteer };
  }, [selectionData]);

  const handleQuickEvaluation = (
    inscricaoId: number,
    field: keyof QuickEvaluation,
    value: any,
  ) => {
    setQuickEvaluations((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        [field]: value,
      },
    }));
  };

  const handleSaveEvaluations = async () => {
    if (!selectedProjectId) return;

    try {
      const evaluationsToSave = Object.values(quickEvaluations)
        .filter(
          (evaluation) =>
            evaluation.rating && evaluation.decision !== 'PENDING',
        )
        .map((evaluation) => ({
          inscricaoId: evaluation.inscricaoId,
          criterios: {
            cr: evaluation.rating * 2, // Convert 1-5 rating to 0-10 scale
            experienciaPrevia: evaluation.rating * 2,
            motivacao: evaluation.rating * 2,
            disponibilidade: evaluation.rating * 2,
            entrevista: evaluation.rating * 2,
          },
          notaFinal: evaluation.rating * 2,
          status:
            evaluation.decision === 'REJECT'
              ? AvaliacaoStatus.REJEITADO
              : AvaliacaoStatus.SELECIONADO,
          observacoes: evaluation.notes,
        }));

      if (evaluationsToSave.length === 0) {
        toast.error('Nenhuma avaliação para salvar');
        return;
      }

      await bulkEvaluation.mutateAsync({
        projetoId: selectedProjectId,
        avaliacoes: evaluationsToSave,
        autoCalcularNota: false,
      });

      toast.success('Avaliações salvas com sucesso!');
      setQuickEvaluations({});
    } catch (error) {
      toast.error('Erro ao salvar avaliações');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="secondary">Aguardando Avaliação</Badge>;
      case 'SELECTED_BOLSISTA':
        return (
          <Badge variant="default" className="bg-green-600">
            Selecionado (Bolsista)
          </Badge>
        );
      case 'SELECTED_VOLUNTARIO':
        return (
          <Badge variant="default" className="bg-blue-600">
            Selecionado (Voluntário)
          </Badge>
        );
      case 'ACCEPTED_BOLSISTA':
        return (
          <Badge variant="default" className="bg-green-800">
            Aceito (Bolsista)
          </Badge>
        );
      case 'ACCEPTED_VOLUNTARIO':
        return (
          <Badge variant="default" className="bg-blue-800">
            Aceito (Voluntário)
          </Badge>
        );
      case 'REJECTED_BY_PROFESSOR':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'REJECTED_BY_STUDENT':
        return <Badge variant="outline">Recusado pelo Estudante</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderCandidateCard = (
    candidate: any,
    type: 'scholarship' | 'volunteer',
  ) => {
    const evaluation = quickEvaluations[candidate.inscricaoId];
    const hasExistingEvaluation = candidate.avaliacao;

    return (
      <Card key={candidate.inscricaoId} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{candidate.aluno.nome}</CardTitle>
              <p className="text-sm text-gray-600">
                Matrícula: {candidate.aluno.matricula} • CR:{' '}
                {candidate.aluno.cr}
              </p>
              <p className="text-sm text-gray-500">
                Email: {candidate.aluno.email}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(candidate.status)}
              {hasExistingEvaluation && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Nota: {candidate.avaliacao.notaFinal.toFixed(1)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {!hasExistingEvaluation && candidate.status === 'SUBMITTED' && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Avaliação Rápida (1-5 estrelas)
                </Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        handleQuickEvaluation(
                          candidate.inscricaoId,
                          'rating',
                          rating,
                        )
                      }
                      className={`p-1 ${
                        evaluation?.rating >= rating
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Decisão</Label>
                <Select
                  value={evaluation?.decision || 'PENDING'}
                  onValueChange={(value) =>
                    handleQuickEvaluation(
                      candidate.inscricaoId,
                      'decision',
                      value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="SELECT_SCHOLARSHIP">
                      Selecionar (Bolsista)
                    </SelectItem>
                    <SelectItem value="SELECT_VOLUNTEER">
                      Selecionar (Voluntário)
                    </SelectItem>
                    <SelectItem value="REJECT">Rejeitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea
                  placeholder="Observações sobre o candidato..."
                  value={evaluation?.notes || ''}
                  onChange={(e) =>
                    handleQuickEvaluation(
                      candidate.inscricaoId,
                      'notes',
                      e.target.value,
                    )
                  }
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}

        {hasExistingEvaluation && (
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600">
              <strong>Observações:</strong>{' '}
              {candidate.avaliacao.observacoes || 'Nenhuma observação'}
            </div>
          </CardContent>
        )}
      </Card>
    );
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
      title="Gerenciar Candidaturas"
      subtitle="Avalie e selecione candidatos para seus projetos de monitoria"
    >
      <div className="space-y-6">
        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Selecionar Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId?.toString() || ''}
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              disabled={myApprovedProjects.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue 
                  placeholder={
                    myApprovedProjects.length === 0 
                      ? "Nenhum projeto aprovado disponível" 
                      : "Selecione um projeto aprovado para avaliar candidatos"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {myApprovedProjects.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    {projeto.titulo} - {projeto.totalInscritos || 0} candidatos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {myApprovedProjects.length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Nenhum projeto aprovado:</strong> Para gerenciar candidatos, você precisa ter projetos aprovados pelo administrador. 
                  Candidatos só podem se inscrever em projetos com status "Aprovado".
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Overview */}
        {selectedProject && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total de Candidatos</p>
                    <p className="text-2xl font-bold">
                      {selectionData?.estatisticas.totalCandidatos || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Bolsas Disponíveis</p>
                    <p className="text-2xl font-bold">
                      {selectedProject.bolsasDisponibilizadas || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Vagas Voluntárias</p>
                    <p className="text-2xl font-bold">
                      {selectedProject.voluntariosSolicitados || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Avaliados</p>
                    <p className="text-2xl font-bold">
                      {selectionData?.estatisticas.avaliados || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Candidates */}
        {selectedProjectId && (
          <>
            {loadingSelection ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Carregando candidatos...</p>
              </div>
            ) : (
              <Tabs defaultValue="scholarship" className="space-y-4">
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="scholarship">
                      Candidatos a Bolsa ({candidatesByType.scholarship.length})
                    </TabsTrigger>
                    <TabsTrigger value="volunteer">
                      Candidatos Voluntários (
                      {candidatesByType.volunteer.length})
                    </TabsTrigger>
                  </TabsList>

                  {Object.keys(quickEvaluations).length > 0 && (
                    <Button
                      onClick={handleSaveEvaluations}
                      disabled={bulkEvaluation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Avaliações ({Object.keys(quickEvaluations).length})
                    </Button>
                  )}
                </div>

                <TabsContent value="scholarship" className="space-y-4">
                  {candidatesByType.scholarship.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Nenhum candidato a bolsa
                        </h3>
                        <p className="text-gray-500">
                          Ainda não há candidatos interessados em bolsas para
                          este projeto.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    candidatesByType.scholarship.map((candidate) =>
                      renderCandidateCard(candidate, 'scholarship'),
                    )
                  )}
                </TabsContent>

                <TabsContent value="volunteer" className="space-y-4">
                  {candidatesByType.volunteer.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Nenhum candidato voluntário
                        </h3>
                        <p className="text-gray-500">
                          Ainda não há candidatos interessados em vagas
                          voluntárias para este projeto.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    candidatesByType.volunteer.map((candidate) =>
                      renderCandidateCard(candidate, 'volunteer'),
                    )
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </PagesLayout>
  );
}
