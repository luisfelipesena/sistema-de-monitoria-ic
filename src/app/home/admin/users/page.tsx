"use client"

import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUrlColumnFilters } from "@/hooks/useUrlColumnFilters"
import { ADMIN, PROFESSOR, STUDENT, type UserListItem } from "@/types"
import { api } from "@/utils/api"
import { formatUsernameToProperName } from "@/utils/username-formatter"
import type { ColumnDef, FilterFn } from "@tanstack/react-table"
import { BookOpen, GraduationCap, Loader, Mail, Pencil, Trash2, User, UserCheck, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Role filter options
const roleFilterOptions = [
  { value: ADMIN, label: "Administrador" },
  { value: PROFESSOR, label: "Professor" },
  { value: STUDENT, label: "Estudante" },
]

// Custom filter function for username (searches displayName too)
const usernameFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const user = row.original
  const displayName =
    user.professorProfile?.nomeCompleto ||
    user.studentProfile?.nomeCompleto ||
    formatUsernameToProperName(user.username)
  const searchValue = String(filterValue).toLowerCase()
  return (
    user.username.toLowerCase().includes(searchValue) ||
    displayName.toLowerCase().includes(searchValue) ||
    user.email.toLowerCase().includes(searchValue)
  )
}

// Custom filter function for email
const emailFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const user = row.original
  const email = user.email || ""
  const institutionalEmail = user.professorProfile?.emailInstitucional || user.studentProfile?.emailInstitucional || ""
  const searchValue = String(filterValue).toLowerCase()
  return email.toLowerCase().includes(searchValue) || institutionalEmail.toLowerCase().includes(searchValue)
}

// Custom filter function for departamento (multiselect by departamento id)
const departamentoFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true
  const departamentoId = row.original.professorProfile?.departamentoId?.toString()
  return departamentoId ? filterValue.includes(departamentoId) : false
}

// Custom filter function for curso
const cursoFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const cursoNome = row.original.studentProfile?.cursoNome || ""
  const searchValue = String(filterValue).toLowerCase()
  return cursoNome.toLowerCase().includes(searchValue)
}

export default function UsersPage() {
  const router = useRouter()
  const utils = api.useUtils()

  const { data: usersData, isLoading: loadingUsers } = api.user.getUsers.useQuery({})
  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })

  // Delete user state
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso")
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      utils.user.getUsers.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir usuário")
    },
  })

  const handleDeleteClick = (user: UserListItem) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ id: userToDelete.id })
    }
  }

  // URL-based column filters
  const { columnFilters, setColumnFilters } = useUrlColumnFilters()

  const handleEditUser = (userId: number) => {
    router.push(`/home/admin/users/${userId}/edit`)
  }

  // Calcular estatísticas
  const userStats = useMemo(() => {
    if (!usersData?.users) return { total: 0, admins: 0, professors: 0, students: 0 }

    return usersData.users.reduce(
      (acc, user) => {
        acc.total++
        if (user.role === ADMIN) acc.admins++
        else if (user.role === PROFESSOR) acc.professors++
        else if (user.role === STUDENT) acc.students++
        return acc
      },
      { total: 0, admins: 0, professors: 0, students: 0 }
    )
  }, [usersData?.users])

  // Generate filter options for autocomplete
  const nomeFilterOptions = useMemo(() => {
    if (!usersData?.users) return []
    return usersData.users
      .map((user) => {
        const displayName =
          user.professorProfile?.nomeCompleto ||
          user.studentProfile?.nomeCompleto ||
          formatUsernameToProperName(user.username)
        return {
          value: displayName,
          label: `${displayName} (@${user.username})`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [usersData?.users])

  const emailFilterOptions = useMemo(() => {
    if (!usersData?.users) return []
    const emails = new Set<string>()
    usersData.users.forEach((user) => {
      if (user.email) emails.add(user.email)
      if (user.professorProfile?.emailInstitucional) emails.add(user.professorProfile.emailInstitucional)
      if (user.studentProfile?.emailInstitucional) emails.add(user.studentProfile.emailInstitucional)
    })
    return Array.from(emails)
      .map((email) => ({ value: email, label: email }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [usersData?.users])

  const departamentoFilterOptions = useMemo(() => {
    if (!departamentos) return []
    return departamentos.map((d) => ({
      value: d.id.toString(),
      label: d.nome,
    }))
  }, [departamentos])

  const cursoFilterOptions = useMemo(() => {
    if (!usersData?.users) return []
    const uniqueCursos = new Map<string, string>()
    usersData.users.forEach((user) => {
      if (user.studentProfile?.cursoNome && !uniqueCursos.has(user.studentProfile.cursoNome)) {
        uniqueCursos.set(user.studentProfile.cursoNome, user.studentProfile.cursoNome)
      }
    })
    return Array.from(uniqueCursos.entries())
      .map(([curso]) => ({
        value: curso,
        label: curso,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [usersData?.users])

  // Column definitions for users table
  const colunasUsuarios: ColumnDef<UserListItem>[] = useMemo(
    () => [
      {
        id: "username",
        header: createFilterableHeader<UserListItem>({
          title: "Usuário",
          filterType: "text",
          filterPlaceholder: "Buscar nome, username ou email...",
          wide: true,
          autocompleteOptions: nomeFilterOptions,
        }),
        accessorKey: "username",
        filterFn: usernameFilterFn,
        cell: ({ row }) => {
          const user = row.original
          const displayName =
            user.professorProfile?.nomeCompleto ||
            user.studentProfile?.nomeCompleto ||
            formatUsernameToProperName(user.username)

          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-base text-gray-900">{displayName}</span>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              </div>
            </div>
          )
        },
      },
      {
        id: "email",
        header: createFilterableHeader<UserListItem>({
          title: "Email",
          filterType: "text",
          filterPlaceholder: "Buscar email...",
          wide: true,
          autocompleteOptions: emailFilterOptions,
        }),
        accessorKey: "email",
        filterFn: emailFilterFn,
        cell: ({ row }) => {
          const user = row.original
          const institutionalEmail = user.professorProfile?.emailInstitucional || user.studentProfile?.emailInstitucional

          return (
            <div>
              <div className="text-sm">{user.email}</div>
              {institutionalEmail && institutionalEmail !== user.email && (
                <div className="text-xs text-muted-foreground">{institutionalEmail}</div>
              )}
            </div>
          )
        },
      },
      {
        id: "role",
        header: createFilterableHeader<UserListItem>({
          title: "Papel",
          filterType: "multiselect",
          filterOptions: roleFilterOptions,
        }),
        accessorKey: "role",
        filterFn: multiselectFilterFn,
        cell: ({ row }) => {
          const role = row.original.role
          const roleConfig = {
            admin: { label: "Administrador", variant: "default" as const, icon: UserCheck },
            professor: { label: "Professor", variant: "secondary" as const, icon: GraduationCap },
            student: { label: "Estudante", variant: "outline" as const, icon: BookOpen },
          }

          const config = roleConfig[role]
          const Icon = config.icon

          return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          )
        },
      },
      {
        id: "departamentoId",
        header: createFilterableHeader<UserListItem>({
          title: "Departamento",
          filterType: "multiselect",
          filterOptions: departamentoFilterOptions,
        }),
        accessorKey: "professorProfile.departamentoId",
        filterFn: departamentoFilterFn,
        cell: ({ row }) => {
          const user = row.original
          if (user.role !== PROFESSOR || !user.professorProfile) {
            return <span className="text-muted-foreground">-</span>
          }
          const dept = departamentos?.find((d) => d.id === user.professorProfile?.departamentoId)
          return <span className="text-sm">{dept?.nome || "N/A"}</span>
        },
      },
      {
        id: "cursoNome",
        header: createFilterableHeader<UserListItem>({
          title: "Curso",
          filterType: "text",
          filterPlaceholder: "Buscar curso...",
          wide: true,
          autocompleteOptions: cursoFilterOptions,
        }),
        accessorKey: "studentProfile.cursoNome",
        filterFn: cursoFilterFn,
        cell: ({ row }) => {
          const user = row.original
          if (user.role !== STUDENT || !user.studentProfile) {
            return <span className="text-muted-foreground">-</span>
          }
          return <span className="text-sm">{user.studentProfile.cursoNome || "N/A"}</span>
        },
      },
      {
        id: "infoAdicional",
        header: "Info Adicional",
        cell: ({ row }) => {
          const user = row.original

          if (user.role === PROFESSOR && user.professorProfile) {
            return (
              <div className="text-sm">
                <div>Regime: {user.professorProfile.regime || "N/A"}</div>
                {user.professorProfile.matriculaSiape && (
                  <div className="text-xs text-muted-foreground">SIAPE: {user.professorProfile.matriculaSiape}</div>
                )}
              </div>
            )
          }

          if (user.role === STUDENT && user.studentProfile) {
            return (
              <div className="text-sm">
                <div>Matrícula: {user.studentProfile.matricula || "N/A"}</div>
                <div className="text-xs text-muted-foreground">CR: {user.studentProfile.cr?.toFixed(2) || "N/A"}</div>
              </div>
            )
          }

          return <span className="text-muted-foreground">-</span>
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const user = row.original
          const isAdmin = user.role === ADMIN

          return (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              {!isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(user)}
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [departamentos, nomeFilterOptions, emailFilterOptions, departamentoFilterOptions, cursoFilterOptions, deleteUserMutation.isPending]
  )

  const getUserDisplayName = (user: UserListItem) => {
    return user.professorProfile?.nomeCompleto || user.studentProfile?.nomeCompleto || formatUsernameToProperName(user.username)
  }

  return (
    <PagesLayout title="Gerenciar Usuários" subtitle="Administração de usuários do sistema">
      {loadingUsers ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando usuários...</span>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-700">{userStats.total}</div>
                <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Professores</CardTitle>
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{userStats.professors}</div>
                <p className="text-xs text-muted-foreground">Professores ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats.students}</div>
                <p className="text-xs text-muted-foreground">Estudantes matriculados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
                <p className="text-xs text-muted-foreground">Administradores do sistema</p>
              </CardContent>
            </Card>
          </div>

          <TableComponent
            columns={colunasUsuarios}
            data={usersData?.users || []}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userToDelete ? getUserDisplayName(userToDelete) : ""}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. Os projetos do usuário serão arquivados e as inscrições serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PagesLayout>
  )
}
