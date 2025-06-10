"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table" // Supondo que você tenha um DataTable genérico
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  Eye,
  FileSignature,
  FileText,
  FolderKanban,
  List,
  Loader2,
  Mail,
  Pencil,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

type ProjectListItem = {
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

type UserWithProfile = {
  id: number
  username: string
  email: string
  role: UserRole
  profile: {
    id: number
    nomeCompleto: string
    tipo: "professor" | "aluno"
  } | null
}

interface FilterValues {
  status?: string
  departamento?: string
  semestre?: string
  ano?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: projects, isLoading: loadingProjects } = api.admin.listAllProjects.useQuery({})
  const { data: usersData, isLoading: loadingUsers } = api.user.list.useQuery({
    page: 1,
    limit: 100,
  })

  const [activeTab, setActiveTab] = useState<"projetos" | "professores" | "alunos">("projetos")
  const [filters, setFilters] = useState<FilterValues>({})
  const [groupedView, setGroupedView] = useState(false)

  // Filter professors and students from users
  const professores = usersData?.users?.filter((user: UserWithProfile) => user.role === UserRole.PROFESSOR) || []
  const alunos = usersData?.users?.filter((user: UserWithProfile) => user.role === UserRole.STUDENT) || []

  // Calculate project status counts
  const statusCounts = useMemo(() => {
    if (!projects)
      return {
        draft: 0,
        submitted: 0,
        pendingAdminSignature: 0,
        approved: 0,
        rejected: 0,
      }

    return projects.reduce(
      (acc, projeto) => {
        switch (projeto.status) {
          case "DRAFT":
            acc.draft++
            break
          case "SUBMITTED":
            acc.submitted++
            break
          case "PENDING_ADMIN_SIGNATURE":
            acc.pendingAdminSignature++
            break
          case "APPROVED":
            acc.approved++
            break
          case "REJECTED":
            acc.rejected++
            break
        }
        return acc
      },
      { draft: 0, submitted: 0, pendingAdminSignature: 0, approved: 0, rejected: 0 }
    )
  }, [projects])

  const handleAnalyzeProject = (projectId: number) => {
    router.push(`/dashboard/admin/projetos/${projectId}`)
  }

  const handleEditUser = (userId: number, type: "professor" | "aluno") => {
    if (type === "professor") {
      router.push("/dashboard/admin/professores")
    } else {
      router.push("/dashboard/admin/alunos")
    }
  }

  const handleAddUser = (type: "professor" | "aluno") => {
    if (type === "professor") {
      router.push("/dashboard/admin/convidar")
    } else {
      router.push("/dashboard/admin/alunos")
    }
  }

  // Project columns
  const projectColumns: ColumnDef<ProjectListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Título
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
            {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamento.nome}</div>}
          </div>
        )
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "APPROVED") {
          return <Badge variant="default">Aprovado</Badge>
        } else if (status === "REJECTED") {
          return <Badge variant="destructive">Rejeitado</Badge>
        } else if (status === "SUBMITTED") {
          return <Badge variant="secondary">Em análise</Badge>
        } else if (status === "DRAFT") {
          return <Badge variant="outline">Rascunho</Badge>
        } else if (status === "PENDING_ADMIN_SIGNATURE") {
          return <Badge variant="secondary">Pendente de assinatura</Badge>
        }
        return <Badge variant="outline">{status}</Badge>
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsistas
        </div>
      ),
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas || 0
        return <span>{bolsas}</span>
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <UserPlus className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: "voluntariosSolicitados",
      cell: ({ row }) => <div className="text-center">{row.original.voluntariosSolicitados}</div>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleAnalyzeProject(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            Analisar
          </Button>
        </div>
      ),
    },
  ]

  // Professor columns
  const professorColumns: ColumnDef<UserWithProfile>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Professor
        </div>
      ),
      accessorKey: "username",
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.profile?.nomeCompleto || row.original.username}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: "email",
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditUser(row.original.id, "professor")}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      ),
    },
  ]

  // Student columns
  const studentColumns: ColumnDef<UserWithProfile>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Aluno
        </div>
      ),
      accessorKey: "username",
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.profile?.nomeCompleto || row.original.username}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: "email",
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditUser(row.original.id, "aluno")}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      ),
    },
  ]

  // Action buttons
  const dashboardActions = (
    <>
      <Button
        variant={groupedView ? "secondary" : "default"}
        className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
        onClick={() => {
          if (activeTab === "projetos") {
            setGroupedView(!groupedView)
          } else if (activeTab === "professores") {
            handleAddUser("professor")
          } else if (activeTab === "alunos") {
            handleAddUser("aluno")
          }
        }}
      >
        {activeTab === "projetos" ? (
          <>
            <FolderKanban className="w-4 h-4 mr-2" />
            {groupedView ? "Visão Normal" : "Agrupar por Departamento"}
          </>
        ) : activeTab === "professores" ? (
          "Adicionar Professor"
        ) : (
          "Adicionar Aluno"
        )}
      </Button>
    </>
  )

  if (loadingProjects || loadingUsers) {
    return (
      <PagesLayout title="Dashboard Administrativo" subtitle="Visão geral do sistema de monitoria">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </PagesLayout>
    )
  }

  // Escolha os dados e colunas de acordo com a view ativa
  let tableData: any[] = []
  let tableColumns: ColumnDef<any>[] = []

  if (activeTab === "projetos") {
    tableData = projects || []
    tableColumns = projectColumns
  } else if (activeTab === "professores") {
    tableData = professores
    tableColumns = professorColumns
  } else if (activeTab === "alunos") {
    tableData = alunos
    tableColumns = studentColumns
  }

  return (
    <PagesLayout
      title="Dashboard Administrativo"
      subtitle="Visão geral do sistema de monitoria"
      actions={dashboardActions}
    >
      <div className="space-y-6">
        {/* Tabs para alternar entre Projetos, Professores e Alunos */}
        <div className="flex gap-2 mb-4">
          <Button variant={activeTab === "projetos" ? "default" : "outline"} onClick={() => setActiveTab("projetos")}>
            Projetos
          </Button>
          <Button
            variant={activeTab === "professores" ? "default" : "outline"}
            onClick={() => setActiveTab("professores")}
          >
            Professores
          </Button>
          <Button variant={activeTab === "alunos" ? "default" : "outline"} onClick={() => setActiveTab("alunos")}>
            Alunos
          </Button>
        </div>

        {/* Tabela dinâmica conforme a view */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "projetos" ? "Projetos" : activeTab === "professores" ? "Professores" : "Alunos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={tableColumns} data={tableData} />
          </CardContent>
        </Card>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projetos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">{statusCounts.approved} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{professores.length + alunos.length}</div>
              <p className="text-xs text-muted-foreground">
                {professores.length} professores, {alunos.length} estudantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statusCounts.pendingAdminSignature}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {/* Needs total courses from API */}
                15 cursos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statusCounts.draft}</div>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
                <AlertTriangle className="h-4 w-4 text-gray-500 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.submitted}</div>
                <p className="text-sm text-muted-foreground">Em Análise</p>
                <Clock className="h-4 w-4 text-yellow-500 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{statusCounts.pendingAdminSignature}</div>
                <p className="text-sm text-muted-foreground">Pend. Assinatura</p>
                <FileSignature className="h-4 w-4 text-purple-500 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
                <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projetos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects?.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.professorResponsavel.nomeCompleto} • {project.departamento.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          project.status === "APPROVED"
                            ? "success"
                            : project.status === "REJECTED"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/admin/projetos")}>
                  Ver Todos os Projetos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {professores.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{user.profile?.nomeCompleto || user.username}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Professor</Badge>
                      <Button size="sm" variant="outline">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {alunos.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{user.profile?.nomeCompleto || user.username}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Estudante</Badge>
                      <Button size="sm" variant="outline">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/admin/usuarios")}>
                  Gerenciar Usuários
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PagesLayout>
  )
}
