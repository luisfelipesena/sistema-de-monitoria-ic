"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Loader,
  School,
  User,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardStudent() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const { data: inscricoes, isLoading: loadingInscricoes } = api.inscricao.getMinhasInscricoes.useQuery()

  if (!isAuthenticated || user?.role !== "student") {
    return null
  }

  const statusCounts = {
    inscrito: inscricoes?.filter((i: any) => i.status === "SUBMITTED").length || 0,
    selecionado:
      inscricoes?.filter((i: any) => i.status === "SELECTED_BOLSISTA" || i.status === "SELECTED_VOLUNTARIO").length ||
      0,
    aprovado:
      inscricoes?.filter((i: any) => i.status === "ACCEPTED_BOLSISTA" || i.status === "ACCEPTED_VOLUNTARIO").length ||
      0,
    rejeitado: inscricoes?.filter((i: any) => i.status === "REJECTED_BY_PROFESSOR").length || 0,
  }

  const colunas: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Disciplina</span>
        </div>
      ),
      accessorKey: "projeto",
      cell: ({ row }) => {
        const disciplinas = row.original.projeto?.disciplinas
        const disciplina = disciplinas && disciplinas.length > 0 ? disciplinas[0] : null
        return (
          <div>
            <span className="font-semibold text-sm sm:text-base text-gray-900">{disciplina?.codigo || "N/A"}</span>
            <div className="text-xs sm:text-sm text-muted-foreground">{disciplina?.nome || ""}</div>
          </div>
        )
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Professor</span>
        </div>
      ),
      accessorKey: "projeto",
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm">{row.original.projeto?.professorResponsavel?.nomeCompleto || "N/A"}</div>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Departamento</span>
        </div>
      ),
      accessorKey: "projeto",
      cell: ({ row }) => <div className="text-xs sm:text-sm">{row.original.projeto?.departamento?.nome || "N/A"}</div>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Tipo</span>
        </div>
      ),
      accessorKey: "tipoVagaPretendida",
      cell: ({ row }) => (
        <Badge variant={row.original.tipoVagaPretendida === "BOLSISTA" ? "default" : "secondary"} className="text-xs">
          {row.original.tipoVagaPretendida === "BOLSISTA" ? "Bolsista" : "Voluntário"}
        </Badge>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Status</span>
        </div>
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        const getStatusBadge = () => {
          switch (status) {
            case "inscrito":
              return (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  Inscrito
                </Badge>
              )
            case "selecionado":
              return (
                <Badge variant="default" className="bg-green-500 text-xs">
                  Selecionado
                </Badge>
              )
            case "aprovado":
              return (
                <Badge variant="default" className="bg-green-600 text-xs">
                  Aprovado
                </Badge>
              )
            case "rejeitado":
              return (
                <Badge variant="destructive" className="text-xs">
                  Rejeitado
                </Badge>
              )
            default:
              return (
                <Badge variant="outline" className="text-xs">
                  {status}
                </Badge>
              )
          }
        }
        return getStatusBadge()
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm">Período</span>
        </div>
      ),
      accessorKey: "projeto",
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm">
          {row.original.projeto?.ano || ""}.{row.original.projeto?.semestre === "SEMESTRE_1" ? "1" : "2"}
        </div>
      ),
    },
  ]

  const dashboardActions = (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Button
        variant="primary"
        size="sm"
        onClick={() => router.push("/home/student/inscricao-monitoria")}
        className="text-xs sm:text-sm px-2 sm:px-4"
      >
        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Inscrever-se</span>
        <span className="sm:hidden">Inscrever</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/home/student/resultados")}
        className="text-xs sm:text-sm px-2 sm:px-4"
      >
        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Ver Resultados</span>
        <span className="sm:hidden">Resultados</span>
      </Button>
    </div>
  )

  return (
    <PagesLayout
      title="Dashboard - Aluno"
      subtitle="Acompanhe suas inscrições e status nas monitorias"
      actions={dashboardActions}
    >
      {loadingInscricoes ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-sm sm:text-base">Carregando inscrições...</span>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Inscrições</CardTitle>
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{statusCounts.inscrito}</div>
                <p className="text-xs text-muted-foreground">Aguardando seleção</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Selecionado</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-green-600">{statusCounts.selecionado}</div>
                <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Aprovado</CardTitle>
                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-green-700">{statusCounts.aprovado}</div>
                <p className="text-xs text-muted-foreground">Monitor ativo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Rejeitado</CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-red-600">{statusCounts.rejeitado}</div>
                <p className="text-xs text-muted-foreground">Não selecionado</p>
              </CardContent>
            </Card>
          </div>

          <TableComponent
            columns={colunas}
            data={inscricoes || []}
            searchPlaceholder="Buscar por disciplina..."
            isLoading={loadingInscricoes}
            emptyMessage="Nenhuma inscrição encontrada."
          />
        </>
      )}
    </PagesLayout>
  )
}
