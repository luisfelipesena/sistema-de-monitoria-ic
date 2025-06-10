"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle, Clock, Eye, Loader2, Users, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Projeto = {
  id: number
  titulo: string
  ano: number
  semestre: "SEMESTRE_1" | "SEMESTRE_2"
  status: string
  professorResponsavel: {
    id: number
    nomeCompleto: string
  }
  departamento: {
    id: number
    nome: string
    sigla: string | null
  }
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number | null
  voluntariosSolicitados: number
  createdAt: Date
  updatedAt: Date | null
}

export default function AdminProjetosPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [anoFilter, setAnoFilter] = useState<string>("all")

  const { data: projetos, isLoading } = api.admin.listAllProjects.useQuery({})
  const utils = api.useUtils()

  const handleStatusChange = (projectId: number, newStatus: string) => {
    toast.info("Funcionalidade de atualização de status será implementada em breve")
  }

  const handleViewProject = (projectId: number) => {
    router.push(`/dashboard/admin/projetos/${projectId}`)
  }

  const getStatusDisplayName = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: "Rascunho",
      SUBMITTED: "Submetido",
      APPROVED: "Aprovado",
      REJECTED: "Rejeitado",
      PENDING_ADMIN_SIGNATURE: "Aguardando Assinatura",
      PENDING_PROFESSOR_SIGNATURE: "Aguardando Professor",
    }
    return statusMap[status] || status
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "REJECTED":
        return "destructive"
      case "SUBMITTED":
      case "PENDING_ADMIN_SIGNATURE":
      case "PENDING_PROFESSOR_SIGNATURE":
        return "secondary"
      default:
        return "outline"
    }
  }

  const filteredProjects =
    projetos?.filter((projeto) => {
      const statusMatch = statusFilter === "all" || projeto.status === statusFilter
      const anoMatch = anoFilter === "all" || projeto.ano.toString() === anoFilter
      return statusMatch && anoMatch
    }) || []

  const columns: ColumnDef<Projeto>[] = [
    {
      accessorKey: "titulo",
      header: "Título",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">{row.original.professorResponsavel.nomeCompleto}</div>
        </div>
      ),
    },
    {
      accessorKey: "departamento",
      header: "Departamento",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.departamento.sigla || row.original.departamento.nome}</span>
          {row.original.departamento.sigla && (
            <div className="text-xs text-muted-foreground">{row.original.departamento.nome}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status) as any}>
          {getStatusDisplayName(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "bolsas",
      header: "Bolsas",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Users className="w-4 h-4" />
            <span>
              {row.original.bolsasDisponibilizadas || 0}/{row.original.bolsasSolicitadas}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{row.original.voluntariosSolicitados} voluntários</div>
        </div>
      ),
    },
    {
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.ano}</div>
          <div className="text-muted-foreground">{row.original.semestre === "SEMESTRE_1" ? "1º Sem" : "2º Sem"}</div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const projeto = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleViewProject(projeto.id)} title="Visualizar">
              <Eye className="h-4 w-4" />
            </Button>
            {projeto.status === "SUBMITTED" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleStatusChange(projeto.id, "APPROVED")}
                  title="Aprovar"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange(projeto.id, "REJECTED")}
                  title="Rejeitar"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  const statusCounts = {
    total: projetos?.length || 0,
    draft: projetos?.filter((p) => p.status === "DRAFT").length || 0,
    submitted: projetos?.filter((p) => p.status === "SUBMITTED").length || 0,
    pending: projetos?.filter((p) => p.status.includes("PENDING")).length || 0,
    approved: projetos?.filter((p) => p.status === "APPROVED").length || 0,
    rejected: projetos?.filter((p) => p.status === "REJECTED").length || 0,
  }

  return (
    <PagesLayout title="Gerenciar Projetos" subtitle="Visualize e gerencie todos os projetos de monitoria">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <p className="text-xs text-muted-foreground">projetos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submetidos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.submitted}</div>
              <p className="text-xs text-muted-foreground">aguardando análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statusCounts.pending}</div>
              <p className="text-xs text-muted-foreground">aguardando assinatura</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
              <p className="text-xs text-muted-foreground">não aprovados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os projetos por status e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="SUBMITTED">Submetido</SelectItem>
                    <SelectItem value="PENDING_ADMIN_SIGNATURE">Aguardando Assinatura</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                    <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Ano</label>
                <Select value={anoFilter} onValueChange={setAnoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Projetos ({filteredProjects.length})</CardTitle>
            <CardDescription>Todos os projetos de monitoria cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando projetos...</span>
              </div>
            ) : filteredProjects.length > 0 ? (
              <DataTable columns={columns} data={filteredProjects} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {statusFilter !== "all" || anoFilter !== "all"
                    ? "Nenhum projeto encontrado com os filtros aplicados."
                    : "Nenhum projeto cadastrado no sistema."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}
