"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/utils/api"
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react"
import Link from "next/link"

export default function ProfessorDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = api.relatorios.getDashboardAnalytics.useQuery({
    userRole: "professor" as any,
  })

  const { data: myProjects, isLoading: projectsLoading } = api.projeto.list.useQuery({})

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">Aprovado</Badge>
      case "PENDING_ADMIN_SIGNATURE":
        return <Badge variant="warning">Pendente Assinatura</Badge>
      case "DRAFT":
        return <Badge variant="secondary">Rascunho</Badge>
      case "SUBMITTED":
        return <Badge variant="warning">Em Análise</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const professorActions = (
    <>
      <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
        <FileSignature className="w-4 h-4 mr-2" />
        Assinar Documentos
      </Button>
      <Button className="bg-[#1B2A50] text-white hover:bg-[#24376c]">
        <Plus className="w-4 h-4 mr-2" />
        Novo Projeto
      </Button>
    </>
  )

  if (analyticsLoading || projectsLoading) {
    return (
      <PagesLayout title="Dashboard do Professor" subtitle="Gerencie seus projetos e monitores">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </PagesLayout>
    )
  }

  const pendingInscricoes = (analytics?.totalInscricoes || 0) - (analytics?.approvedInscricoes || 0)

  return (
    <PagesLayout
      title="Dashboard do Professor"
      subtitle="Gerencie seus projetos e monitores"
      actions={professorActions}
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Projetos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">{analytics?.approvedProjects || 0} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalInscricoes || 0}</div>
              <p className="text-xs text-muted-foreground">{pendingInscricoes} pendentes avaliação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics?.approvedInscricoes || 0}</div>
              <p className="text-xs text-muted-foreground">Monitores selecionados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.approvedProjects || 0}</div>
              <p className="text-xs text-muted-foreground">Com monitoria ativa</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Alert */}
        {pendingInscricoes > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ação Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-3">Você tem {pendingInscricoes} candidaturas pendentes de avaliação.</p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Users className="w-4 h-4 mr-2" />
                Avaliar Candidatos
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meus Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myProjects?.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.ano}.{project.semestre === "SEMESTRE_1" ? 1 : 2}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getProjectStatusBadge(project.status as string)}
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Ver Todos os Projetos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center h-full">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Visualize e gerencie todas as candidaturas para seus projetos em um só lugar.</p>
                <Link href="/dashboard/professor/candidatos">
                  <Button variant="outline" className="w-full">
                    Gerenciar Candidatos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics?.approvedProjects || 0}</div>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analytics?.pendingProjects || 0}</div>
                <p className="text-sm text-muted-foreground">Aguardando Aprovação</p>
                <Clock className="h-4 w-4 text-orange-500 mx-auto mt-1" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics?.projectsByStatus?.DRAFT || 0}</div>
                <p className="text-sm text-muted-foreground">Em Elaboração</p>
                <FileText className="h-4 w-4 text-blue-500 mx-auto mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}
