'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, GraduationCap, Save, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/volunteer-management',
)({
  component: VolunteerManagementPage,
});

function VolunteerManagementPage() {
  const { user } = useAuth();
  const { data: projetos, isLoading } = useProjetos();
  const [volunteerCounts, setVolunteerCounts] = useState<
    Record<number, number>
  >({});

  // Filter only approved projects for the current professor
  const approvedProjects = useMemo(() => {
    if (!projetos) return [];
    return projetos.filter(
      (projeto) =>
        projeto.status === 'APPROVED' &&
        projeto.professorResponsavelNome === user?.username,
    );
  }, [projetos, user]);

  const handleVolunteerCountChange = (projectId: number, count: number) => {
    setVolunteerCounts((prev) => ({
      ...prev,
      [projectId]: Math.max(0, count), // Ensure non-negative
    }));
  };

  const handleSaveVolunteerCount = async (projectId: number) => {
    const count = volunteerCounts[projectId] || 0;

    try {
      // Here would be the API call to update volunteer count
      console.log('Updating volunteer count:', { projectId, count });

      toast.success('Número de voluntários atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar número de voluntários');
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const [projectId, count] of Object.entries(volunteerCounts)) {
        if (count > 0) {
          console.log('Updating volunteer count:', {
            projectId: parseInt(projectId),
            count,
          });
        }
      }

      toast.success('Todos os números de voluntários foram atualizados!');
    } catch (error) {
      toast.error('Erro ao atualizar números de voluntários');
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

  const totalVolunteersRequested = Object.values(volunteerCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <PagesLayout
      title="Gerenciar Voluntários"
      subtitle="Defina o número de monitores voluntários para seus projetos aprovados"
      actions={
        <Button
          onClick={handleSaveAll}
          disabled={Object.keys(volunteerCounts).length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Todas as Alterações
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {approvedProjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Projetos Aprovados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {approvedProjects.reduce(
                      (sum, p) => sum + (p.bolsasDisponibilizadas || 0),
                      0,
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bolsas Disponibilizadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalVolunteersRequested}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Voluntários Solicitados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Carregando projetos...</p>
            </div>
          </div>
        ) : approvedProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhum projeto aprovado encontrado
              </h3>
              <p className="text-gray-500">
                Você não possui projetos aprovados no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {approvedProjects.map((projeto) => (
              <Card key={projeto.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {projeto.titulo}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {projeto.departamentoNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {projeto.ano}.
                          {projeto.semestre === 'SEMESTRE_1' ? 1 : 2}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success">Aprovado</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Disciplinas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {projeto.disciplinas.map((disciplina: any) => (
                          <Badge key={disciplina.id} variant="outline">
                            {disciplina.codigo} - {disciplina.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-green-800 mb-1">
                          Bolsas Disponibilizadas
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {projeto.bolsasDisponibilizadas || 0}
                        </div>
                        <div className="text-xs text-green-600">
                          Definido pela administração
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          Voluntários Atuais
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {projeto.voluntariosSolicitados}
                        </div>
                        <div className="text-xs text-blue-600">
                          Definido anteriormente
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <Label
                          htmlFor={`volunteers-${projeto.id}`}
                          className="text-sm font-medium text-purple-800 mb-2 block"
                        >
                          Novos Voluntários Desejados
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`volunteers-${projeto.id}`}
                            type="number"
                            min="0"
                            max="20"
                            placeholder="0"
                            value={volunteerCounts[projeto.id] || ''}
                            onChange={(e) =>
                              handleVolunteerCountChange(
                                projeto.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="text-center font-bold text-purple-600"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveVolunteerCount(projeto.id)}
                            disabled={!volunteerCounts[projeto.id]}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          Máximo: 20 voluntários
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Total de monitores para este projeto:</strong>{' '}
                        {(projeto.bolsasDisponibilizadas || 0) +
                          (volunteerCounts[projeto.id] ||
                            projeto.voluntariosSolicitados)}{' '}
                        ({projeto.bolsasDisponibilizadas || 0} bolsistas +{' '}
                        {volunteerCounts[projeto.id] ||
                          projeto.voluntariosSolicitados}{' '}
                        voluntários)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-lg">
              📋 Instruções
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Bolsas:</strong> O número de bolsas já foi definido pela
              administração com base na disponibilidade da PROGRAD.
            </p>
            <p>
              • <strong>Voluntários:</strong> Você pode definir quantos
              monitores voluntários adicionais deseja para cada projeto.
            </p>
            <p>
              • <strong>Limite:</strong> O máximo é de 20 voluntários por
              projeto.
            </p>
            <p>
              • <strong>Prazo:</strong> Defina os números antes da abertura do
              edital de seleção.
            </p>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
}
