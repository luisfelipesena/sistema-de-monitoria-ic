"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/utils/api"
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Building,
  ClipboardList,
  FileText,
  GraduationCap,
  PieChart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"

export default function AnalyticsPage() {
  const { data: metrics, isLoading, error } = api.analytics.getDashboard.useQuery()

  if (error) {
    return (
      <PagesLayout title="Analytics" subtitle="Painel de métricas e indicadores">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar métricas: {error.message}</AlertDescription>
        </Alert>
      </PagesLayout>
    )
  }

  if (isLoading) {
    return (
      <PagesLayout title="Analytics" subtitle="Painel de métricas e indicadores">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PagesLayout>
    )
  }

  if (!metrics) {
    return (
      <PagesLayout title="Analytics" subtitle="Painel de métricas e indicadores">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Nenhuma métrica disponível no momento.</AlertDescription>
        </Alert>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Analytics" subtitle="Painel de métricas e indicadores">
      <div className="space-y-6">
        {/* Métricas Gerais */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Visão Geral do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Períodos Ativos</p>
                    <div className="text-2xl font-bold text-green-600">{metrics.periodosAtivos}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
                    <div className="text-2xl font-bold">{metrics.totalProjetos}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Projetos Aprovados</p>
                    <div className="text-2xl font-bold text-green-600">{metrics.projetosAprovados}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</p>
                    <div className="text-2xl font-bold text-purple-600">{metrics.taxaAprovacao.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas de Usuários */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Usuários do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Alunos</p>
                    <div className="text-2xl font-bold text-blue-600">{metrics.totalAlunos}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Professores</p>
                    <div className="text-2xl font-bold text-green-600">{metrics.totalProfessores}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-orange-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Departamentos</p>
                    <div className="text-2xl font-bold text-orange-600">{metrics.totalDepartamentos}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Cursos</p>
                    <div className="text-2xl font-bold text-purple-600">{metrics.totalCursos}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Disciplinas</p>
                    <div className="text-2xl font-bold text-indigo-600">{metrics.totalDisciplinas}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas de Vagas e Inscrições */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Estatísticas de Vagas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bolsas Disponibilizadas</span>
                <Badge variant="default">{metrics.estatisticasVagas.bolsistas}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Voluntários Solicitados</span>
                <Badge variant="secondary">{metrics.estatisticasVagas.voluntarios}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Disponibilizadas</span>
                <Badge variant="outline">{metrics.estatisticasVagas.totalDisponibilizadas}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vagas Ocupadas</span>
                <Badge variant="destructive">{metrics.estatisticasVagas.ocupadas}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Ocupação</span>
                <Badge variant={metrics.estatisticasVagas.taxaOcupacao > 80 ? "default" : "secondary"}>
                  {metrics.estatisticasVagas.taxaOcupacao.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Status dos Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rascunhos</span>
                <Badge variant="outline">{metrics.projetosRascunho}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Submetidos</span>
                <Badge variant="secondary">{metrics.projetosSubmetidos}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Aprovados</span>
                <Badge variant="default">{metrics.projetosAprovados}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Inscrições</span>
                <Badge variant="outline">{metrics.totalInscricoes}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuições */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Projetos por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.projetosPorDepartamento.slice(0, 8).map((dept, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dept.departamento}</span>
                      <Badge variant="outline" className="text-xs">
                        {dept.sigla}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {dept.aprovados}/{dept.total}
                      </span>
                      <Badge variant={dept.aprovados > 0 ? "default" : "secondary"}>{dept.total}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Inscrições por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.inscricoesPorPeriodo.map((periodo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {periodo.ano}.{periodo.semestre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{periodo.projetos} projetos</span>
                      <Badge variant="default">{periodo.inscricoes} inscrições</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Engajamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Alunos por Curso (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.alunosPorCurso.slice(0, 5).map((curso, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{curso.curso}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{curso.inscricoes} inscrições</span>
                      <Badge variant="default">{curso.alunos} alunos</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Professores por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.professoresPorDepartamento.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept.departamento}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{dept.projetosAtivos} projetos ativos</span>
                      <Badge variant="default">{dept.professores} professores</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PagesLayout>
  )
}
