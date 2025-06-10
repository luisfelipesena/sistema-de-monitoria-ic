"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/utils/api"
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Users,
} from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  const { data: user, isLoading: userLoading } = api.auth.me.useQuery()

  const { data: studentProfile, isLoading: profileLoading } = api.student.getProfile.useQuery(
    { userId: user!.id },
    { enabled: !!user }
  )
  const alunoId = studentProfile?.id

  const { data: stats, isLoading: statsLoading } = api.student.getDashboardInfo.useQuery(
    { alunoId: alunoId! },
    { enabled: !!alunoId }
  )

  const { data: activePeriods, isLoading: periodsLoading } = api.public.getCurrentPeriods.useQuery()
  const canApply = activePeriods && activePeriods.length > 0
  const activePeriodId = activePeriods?.[0]?.id

  const { data: projects, isLoading: projectsLoading } = api.student.getProjetosDisponiveis.useQuery(
    {
      alunoId: alunoId!,
      periodoInscricaoId: activePeriodId!,
    },
    {
      enabled: !!alunoId && !!activePeriodId,
    }
  )

  const isLoading = userLoading || profileLoading || statsLoading || periodsLoading || projectsLoading

  if (isLoading) {
    return (
      <PagesLayout title="Dashboard do Estudante" subtitle="Bem-vindo ao sistema de monitoria">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Dashboard do Estudante" subtitle="Bem-vindo ao sistema de monitoria">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Disponíveis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Projetos abertos para inscrição</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas Inscrições</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.totalInscricoes || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.inscricoesPendentes || 0} pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagas Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.vagasAtivas || 0}</div>
              <p className="text-xs text-muted-foreground">Monitorias que você participa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Inscrição</CardTitle>
              {canApply ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${canApply ? "text-green-600" : "text-red-600"}`}>
                {canApply ? "ABERTO" : "FECHADO"}
              </div>
              <p className="text-xs text-muted-foreground">Período de inscrições</p>
            </CardContent>
          </Card>
        </div>

        {canApply && activePeriods && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período de Inscrições Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activePeriods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">
                        {period.ano}.{period.semestre === "SEMESTRE_1" ? "1" : "2"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        Até {new Date(period.dataFim).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/dashboard/student/inscricao">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Fazer Inscrição em Monitoria
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Projetos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {projects?.map((project) => (
                <Card key={project.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.titulo}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {(project.bolsasDisponibilizadas || 0) > 0 && (
                          <Badge variant="success">{project.bolsasDisponibilizadas} Bolsa(s)</Badge>
                        )}
                        {(project.voluntariosSolicitados || 0) > 0 && (
                          <Badge variant="secondary">{project.voluntariosSolicitados} Voluntário(s)</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {/* {project.disciplinas?.[0]?.codigo || "N/A"} */}
                        </span>
                      </div>
                      <Link href={`/dashboard/student/inscricao?projeto=${project.id}`}>
                        <Button size="sm" variant="outline">
                          Ver Detalhes e Inscrever-se
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}
