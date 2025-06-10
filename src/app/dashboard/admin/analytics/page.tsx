"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/utils/api"
import { BarChart3, FileText, PieChart, TrendingUp, Users } from "lucide-react"

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = api.relatorios.getDashboardAnalytics.useQuery({
    userRole: "admin" as any,
  })

  const getStatusDisplayName = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: "Rascunho",
      SUBMITTED: "Submetido",
      APPROVED: "Aprovado",
      REJECTED: "Rejeitado",
      PENDING_ADMIN_SIGNATURE: "Aguardando Assinatura Admin",
      PENDING_PROFESSOR_SIGNATURE: "Aguardando Assinatura Professor",
    }
    return statusMap[status] || status
  }

  if (isLoading) {
    return (
      <PagesLayout title="Analytics" subtitle="Análise detalhada dos dados do sistema">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PagesLayout>
    )
  }

  if (!analytics) {
    return (
      <PagesLayout title="Analytics" subtitle="Análise detalhada dos dados do sistema">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Erro ao carregar dados de analytics.</p>
          </CardContent>
        </Card>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Analytics" subtitle="Análise detalhada dos dados do sistema">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">{analytics.approvedProjects} aprovados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Pendentes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.pendingProjects}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInscricoes}</div>
              <p className="text-xs text-muted-foreground">{analytics.approvedInscricoes} aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalBolsas > 0 ? Math.round((analytics.bolsasOcupadas / analytics.totalBolsas) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.bolsasOcupadas}/{analytics.totalBolsas} bolsas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Projetos por Status</CardTitle>
              <CardDescription>Distribuição dos projetos por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.projectsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{getStatusDisplayName(status)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${analytics.totalProjects > 0 ? (count / analytics.totalProjects) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projetos por Departamento</CardTitle>
              <CardDescription>Distribuição dos projetos por departamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.projectsByDepartment.slice(0, 5).map((dept) => (
                  <div key={dept.departamento} className="flex items-center justify-between">
                    <span className="text-sm truncate">{dept.departamento}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${analytics.totalProjects > 0 ? (dept.total / analytics.totalProjects) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{dept.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tendências Mensais</CardTitle>
            <CardDescription>Evolução de projetos e inscrições ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-64 gap-4">
              {analytics.monthlyTrends.map((trend) => (
                <div key={trend.month} className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-8 bg-blue-500 rounded-t"
                      style={{ height: `${Math.max((trend.projects / 30) * 200, 8)}px` }}
                      title={`${trend.projects} projetos`}
                    ></div>
                    <div
                      className="w-8 bg-green-500 rounded-t"
                      style={{ height: `${Math.max((trend.inscricoes / 100) * 200, 8)}px` }}
                      title={`${trend.inscricoes} inscrições`}
                    ></div>
                  </div>
                  <span className="text-xs">{trend.month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Projetos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Inscrições</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas Professores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de professores:</span>
                <span className="font-medium">{analytics.totalProfessors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Com projetos ativos:</span>
                <span className="font-medium">{analytics.approvedProjects}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas Estudantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de estudantes:</span>
                <span className="font-medium">{analytics.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Com inscrições:</span>
                <span className="font-medium">{analytics.totalInscricoes}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Estatísticas Bolsas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total disponíveis:</span>
                <span className="font-medium">{analytics.totalBolsas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ocupadas:</span>
                <span className="font-medium">{analytics.bolsasOcupadas}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PagesLayout>
  )
}
