"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/utils/api"
import { BarChart3, Download, FileText, Filter, PieChart, TrendingUp, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function AdminReportsPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedSemester, setSelectedSemester] = useState<"SEMESTRE_1" | "SEMESTRE_2" | undefined>()
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "xlsx">("pdf")

  const analyticsQuery = {
    userRole: "admin" as any,
    ano: selectedYear,
    ...(selectedSemester && { semestre: selectedSemester }),
  }

  const reportQuery = {
    ano: selectedYear,
    ...(selectedSemester && { semestre: selectedSemester }),
  }

  const { data: analytics, isLoading: analyticsLoading } = api.relatorios.getDashboardAnalytics.useQuery(analyticsQuery)

  const { data: projectsReport } = api.relatorios.getProjectsReport.useQuery(reportQuery)

  const { data: bolsasReport } = api.relatorios.getBolsasUtilizacao.useQuery(reportQuery)

  const exportRelatarioMutation = api.relatorios.exportarRelatorio.useMutation({
    onSuccess: (result) => {
      window.open(result.fileUrl, "_blank")
      toast.success("Relatório exportado com sucesso!")
    },
    onError: (error) => {
      toast.error("Erro ao exportar relatório", {
        description: error.message,
      })
    },
  })

  const handleExportReport = (tipo: "projetos" | "inscricoes" | "bolsas" | "dashboard") => {
    exportRelatarioMutation.mutateAsync({
      tipo,
      formato: exportFormat,
      filtros: {
        ano: selectedYear,
        ...(selectedSemester && { semestre: selectedSemester }),
      },
      incluirGraficos: true,
    })
  }

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

  return (
    <PagesLayout
      title="Relatórios e Analytics"
      subtitle="Visualize estatísticas detalhadas e exporte relatórios do sistema"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
            </select>

            <Button onClick={() => handleExportReport("dashboard")} disabled={exportRelatarioMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              {exportRelatarioMutation.isPending ? "Exportando..." : "Exportar Dashboard"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
            <CardDescription>Selecione o período para análise dos dados</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="mt-1 w-32 h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Semestre</label>
              <select
                value={selectedSemester || ""}
                onChange={(e) => setSelectedSemester((e.target.value as any) || undefined)}
                className="mt-1 w-40 h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
              >
                <option value="">Todos</option>
                <option value="SEMESTRE_1">1º Semestre</option>
                <option value="SEMESTRE_2">2º Semestre</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {analyticsLoading ? (
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
        ) : (
          analytics && (
            <>
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
                      {analytics.totalBolsas > 0
                        ? Math.round((analytics.bolsasOcupadas / analytics.totalBolsas) * 100)
                        : 0}
                      %
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
                                  width: `${
                                    analytics.totalProjects > 0 ? (count / analytics.totalProjects) * 100 : 0
                                  }%`,
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
                                  width: `${
                                    analytics.totalProjects > 0 ? (dept.total / analytics.totalProjects) * 100 : 0
                                  }%`,
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
            </>
          )
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Projetos
              </CardTitle>
              <CardDescription>Relatório detalhado de todos os projetos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">Total de projetos: {projectsReport?.total || 0}</div>
              <Button
                onClick={() => handleExportReport("projetos")}
                className="w-full"
                variant="outline"
                disabled={exportRelatarioMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Projetos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Relatório de Inscrições
              </CardTitle>
              <CardDescription>Análise das inscrições dos estudantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total de inscrições: {analytics?.totalInscricoes || 0}
              </div>
              <Button
                onClick={() => handleExportReport("inscricoes")}
                className="w-full"
                variant="outline"
                disabled={exportRelatarioMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Inscrições
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatório de Bolsas
              </CardTitle>
              <CardDescription>Utilização e distribuição de bolsas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Taxa de ocupação: {bolsasReport?.resumo.taxaOcupacao || 0}%
              </div>
              <Button
                onClick={() => handleExportReport("bolsas")}
                className="w-full"
                variant="outline"
                disabled={exportRelatarioMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Bolsas
              </Button>
            </CardContent>
          </Card>
        </div>

        {bolsasReport && (
          <Card>
            <CardHeader>
              <CardTitle>Utilização de Bolsas por Departamento</CardTitle>
              <CardDescription>Análise detalhada da alocação de bolsas por departamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Departamento</th>
                      <th className="text-right p-2">Solicitadas</th>
                      <th className="text-right p-2">Disponibilizadas</th>
                      <th className="text-right p-2">Ocupadas</th>
                      <th className="text-right p-2">Taxa Ocupação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bolsasReport.porDepartamento.map((dept) => (
                      <tr key={dept.departamento} className="border-b">
                        <td className="p-2 font-medium">{dept.departamento}</td>
                        <td className="p-2 text-right">{dept.solicitadas}</td>
                        <td className="p-2 text-right">{dept.disponibilizadas}</td>
                        <td className="p-2 text-right">{dept.ocupadas}</td>
                        <td className="p-2 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              dept.taxaOcupacao >= 80
                                ? "bg-green-100 text-green-800"
                                : dept.taxaOcupacao >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {dept.taxaOcupacao}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PagesLayout>
  )
}
