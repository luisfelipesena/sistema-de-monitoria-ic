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
import { useProjetos } from '@/hooks/use-projeto';
import { useSelectionStatus } from '@/hooks/use-selection-process';
import { Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle, Clock, FileText, Users } from 'lucide-react';

interface ProjectSelectionSummary {
  id: number;
  titulo: string;
  status: string;
  totalCandidatos: number;
  pendentes: number;
  selecionados: number;
  processoFinalizado: boolean;
  proximaEtapa: string;
}

function ProjectStatusBadge({
  status,
  finalizado,
}: {
  status: string;
  finalizado: boolean;
}) {
  if (finalizado) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Finalizado
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
      <Clock className="h-3 w-3 mr-1" />
      Em Andamento
    </Badge>
  );
}

function NextStepBadge({ etapa }: { etapa: string }) {
  const getStepInfo = (step: string) => {
    switch (step) {
      case 'avaliar_candidatos':
        return {
          text: 'Avaliar Candidatos',
          variant: 'secondary' as const,
          icon: Users,
        };
      case 'aguardando_confirmacao_estudantes':
        return {
          text: 'Aguardando Estudantes',
          variant: 'default' as const,
          icon: Clock,
        };
      default:
        return { text: step, variant: 'secondary' as const, icon: AlertCircle };
    }
  };

  const { text, variant, icon: Icon } = getStepInfo(etapa);

  return (
    <Badge variant={variant} className="text-xs">
      <Icon className="h-3 w-3 mr-1" />
      {text}
    </Badge>
  );
}

export function SelectionProcessDashboard() {
  const { data: projetos } = useProjetos();

  // Get selection status for each approved project
  const projetosAprovados =
    projetos?.filter((p) => p.status === 'APPROVED') || [];

  const projectsWithSelection: ProjectSelectionSummary[] =
    projetosAprovados.map((projeto) => {
      // This would ideally be done with a batch query, but for now we'll use individual queries
      const selectionData = useSelectionStatus(projeto.id);

      return {
        id: projeto.id,
        titulo: projeto.titulo,
        status: projeto.status,
        totalCandidatos: selectionData.data?.estatisticas.total || 0,
        pendentes: selectionData.data?.estatisticas.pendentes || 0,
        selecionados:
          (selectionData.data?.estatisticas.selecionadosBolsista || 0) +
          (selectionData.data?.estatisticas.selecionadosVoluntario || 0),
        processoFinalizado: selectionData.data?.processoFinalizado || false,
        proximaEtapa: selectionData.data?.proximaEtapa || 'avaliar_candidatos',
      };
    });

  const estatisticasGerais = {
    totalProjetos: projectsWithSelection.length,
    projetosFinalizados: projectsWithSelection.filter(
      (p) => p.processoFinalizado,
    ).length,
    totalCandidatos: projectsWithSelection.reduce(
      (sum, p) => sum + p.totalCandidatos,
      0,
    ),
    totalSelecionados: projectsWithSelection.reduce(
      (sum, p) => sum + p.selecionados,
      0,
    ),
  };

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Projetos</p>
                <p className="text-2xl font-bold">
                  {estatisticasGerais.totalProjetos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Finalizados</p>
                <p className="text-2xl font-bold">
                  {estatisticasGerais.projetosFinalizados}
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
                <p className="text-sm font-medium">Total Candidatos</p>
                <p className="text-2xl font-bold">
                  {estatisticasGerais.totalCandidatos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">Total Selecionados</p>
                <p className="text-2xl font-bold">
                  {estatisticasGerais.totalSelecionados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status dos Processos de Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead className="text-center">Candidatos</TableHead>
                <TableHead className="text-center">Pendentes</TableHead>
                <TableHead className="text-center">Selecionados</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Próxima Etapa</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsWithSelection.map((projeto) => (
                <TableRow key={projeto.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{projeto.titulo}</p>
                      <p className="text-sm text-gray-600">ID: {projeto.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{projeto.totalCandidatos}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {projeto.pendentes > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        {projeto.pendentes}
                      </Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {projeto.selecionados > 0 ? (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        {projeto.selecionados}
                      </Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <ProjectStatusBadge
                      status={projeto.status}
                      finalizado={projeto.processoFinalizado}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <NextStepBadge etapa={projeto.proximaEtapa} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Link to="/home/common/selecao-monitores">
                      <Button size="sm" variant="outline">
                        Gerenciar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {projectsWithSelection.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum projeto aprovado com processo de seleção ativo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Itens de Ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectsWithSelection
              .filter((p) => !p.processoFinalizado && p.totalCandidatos > 0)
              .map((projeto) => (
                <div
                  key={projeto.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium">{projeto.titulo}</p>
                    <p className="text-sm text-gray-600">
                      {projeto.pendentes} candidatos aguardando avaliação
                    </p>
                  </div>
                  <Link to="/home/common/selecao-monitores">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Revisar
                    </Button>
                  </Link>
                </div>
              ))}

            {projectsWithSelection.every(
              (p) => p.processoFinalizado || p.totalCandidatos === 0,
            ) && (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">
                  Todos os processos de seleção estão em dia!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
