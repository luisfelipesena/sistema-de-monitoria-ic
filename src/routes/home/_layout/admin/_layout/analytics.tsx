import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDashboardMetrics } from '@/hooks/use-analytics';
import { createFileRoute } from '@tanstack/react-router';
import {
  BarChart3,
  Calendar,
  FileCheck,
  Loader,
  TrendingUp,
  Users,
} from 'lucide-react';

export const Route = createFileRoute('/home/_layout/admin/_layout/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();

  if (loadingMetrics) {
    return (
      <PagesLayout title="Analytics do Sistema">
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando métricas...</span>
        </div>
      </PagesLayout>
    );
  }

  if (!metrics) {
    return (
      <PagesLayout title="Analytics do Sistema">
        <div className="text-center py-8">
          <p className="text-gray-500">Não foi possível carregar as métricas</p>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout title="Analytics do Sistema">
      <div className="space-y-6">
        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Períodos Ativos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.periodosAtivos}</div>
              <p className="text-xs text-muted-foreground">
                Períodos de inscrição em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Projetos
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProjetos}</div>
              <p className="text-xs text-muted-foreground">
                Projetos cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Aprovação
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taxaAprovacao}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.projetosAprovados} de {metrics.totalProjetos} projetos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Inscrições
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalInscricoes}
              </div>
              <p className="text-xs text-muted-foreground">
                Estudantes inscritos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status dos projetos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status dos Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aprovados</span>
                  <Badge className="bg-green-100 text-green-800">
                    {metrics.projetosAprovados}
                  </Badge>
                </div>
                <Progress
                  value={
                    metrics.totalProjetos > 0
                      ? (metrics.projetosAprovados / metrics.totalProjetos) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Em Análise</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {metrics.projetosSubmetidos}
                  </Badge>
                </div>
                <Progress
                  value={
                    metrics.totalProjetos > 0
                      ? (metrics.projetosSubmetidos / metrics.totalProjetos) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rascunho</span>
                  <Badge className="bg-gray-100 text-gray-800">
                    {metrics.projetosRascunho}
                  </Badge>
                </div>
                <Progress
                  value={
                    metrics.totalProjetos > 0
                      ? (metrics.projetosRascunho / metrics.totalProjetos) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Vagas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.estatisticasVagas.bolsistas}
                  </div>
                  <p className="text-xs text-muted-foreground">Bolsistas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.estatisticasVagas.voluntarios}
                  </div>
                  <p className="text-xs text-muted-foreground">Voluntários</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics.vagasOcupadas}
                  </div>
                  <p className="text-xs text-muted-foreground">Ocupadas</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Ocupação</span>
                  <span>
                    {metrics.estatisticasVagas.totalDisponibilizadas > 0
                      ? Math.round(
                          (metrics.vagasOcupadas /
                            metrics.estatisticasVagas.totalDisponibilizadas) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    metrics.estatisticasVagas.totalDisponibilizadas > 0
                      ? (metrics.vagasOcupadas /
                          metrics.estatisticasVagas.totalDisponibilizadas) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projetos por departamento */}
        {metrics.projetosPorDepartamento.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projetos por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.projetosPorDepartamento.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {dept.departamento}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{dept.total} total</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          {dept.aprovados} aprovados
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={
                        dept.total > 0 ? (dept.aprovados / dept.total) * 100 : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inscrições por período */}
        {metrics.inscricoesPorPeriodo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Inscrições por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.inscricoesPorPeriodo.map((periodo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <span className="font-medium">{periodo.periodo}</span>
                    <div className="flex gap-4 text-sm">
                      <span>{periodo.inscricoes} inscrições</span>
                      <span>{periodo.projetos} projetos</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PagesLayout>
  );
}
