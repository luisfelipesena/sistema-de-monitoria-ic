"use client"

import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useServerPagination } from "@/hooks/useServerPagination"
import { ADMIN, PROFESSOR, STUDENT, type UserListItem, type UserRole, type Regime, type TipoProfessor } from "@/types"
import { api } from "@/utils/api"
import { formatUsernameToProperName } from "@/utils/username-formatter"
import type { ColumnDef } from "@tanstack/react-table"
import { BookOpen, Copy, GraduationCap, KeyRound, Loader, Pencil, Trash2, User, UserCheck, Users } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Role filter options
const roleFilterOptions = [
  { value: ADMIN, label: "Administrador" },
  { value: PROFESSOR, label: "Professor" },
  { value: STUDENT, label: "Estudante" },
]

export default function UsersPage() {
  const router = useRouter()
  const utils = api.useUtils()

  // Server-side pagination with URL state persistence
  const { page, pageSize, setPage, setPageSize, columnFilters, setColumnFilters, apiFilters } = useServerPagination({
    defaultPageSize: 20,
  })

  // Fetch users with server-side filtering and pagination
  const { data: usersData, isLoading: loadingUsers } = api.user.getUsers.useQuery({
    search: apiFilters.username || apiFilters.email,
    role: apiFilters.role as UserRole[] | undefined,
    nomeCompleto: apiFilters.nomeCompleto,
    emailInstitucional: apiFilters.emailInstitucional,
    departamentoId: apiFilters.departamentoId,
    cursoNome: apiFilters.cursoNome,
    regime: apiFilters.regime as Regime[] | undefined,
    tipoProfessor: apiFilters.tipoProfessor as TipoProfessor[] | undefined,
    limit: apiFilters.limit,
    offset: apiFilters.offset,
  })

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

  const handleEditUser = (userId: number) => {
    router.push(`/home/admin/users/${userId}/edit`)
  }

  // Password reset link state
  const [userToReset, setUserToReset] = useState<UserListItem | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetMotivo, setResetMotivo] = useState("")
  const [generatedReset, setGeneratedReset] = useState<{ resetLink: string; emailSent: boolean } | null>(null)

  const generateResetLinkMutation = api.userSupport.generatePasswordResetLink.useMutation({
    onSuccess: (data) => {
      setGeneratedReset({ resetLink: data.resetLink, emailSent: data.emailSent })
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar link de redefinição")
    },
  })

  const handleResetClick = (user: UserListItem) => {
    setUserToReset(user)
    setResetMotivo("")
    setGeneratedReset(null)
    setIsResetDialogOpen(true)
  }

  const handleGenerateResetLink = () => {
    if (userToReset) {
      generateResetLinkMutation.mutate({ userId: userToReset.id, motivo: resetMotivo.trim() })
    }
  }

  // The link is shown once and never stored, so closing discards it.
  const handleResetDialogChange = (open: boolean) => {
    setIsResetDialogOpen(open)
    if (!open) {
      setUserToReset(null)
      setResetMotivo("")
      setGeneratedReset(null)
    }
  }

  const copyResetLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success("Link copiado para a área de transferência!")
  }

  // Stats from server total (accurate across all pages)
  const userStats = useMemo(() => {
    if (!usersData?.users) return { total: usersData?.total ?? 0, admins: 0, professors: 0, students: 0 }

    // Count from current page data for role breakdown
    const counts = usersData.users.reduce(
      (acc, user) => {
        if (user.role === ADMIN) acc.admins++
        else if (user.role === PROFESSOR) acc.professors++
        else if (user.role === STUDENT) acc.students++
        return acc
      },
      { admins: 0, professors: 0, students: 0 }
    )

    return { total: usersData.total, ...counts }
  }, [usersData])

  // Departamento filter options
  const departamentoFilterOptions = useMemo(() => {
    if (!departamentos) return []
    return departamentos.map((d) => ({
      value: d.id.toString(),
      label: d.nome,
    }))
  }, [departamentos])

  // Column definitions for users table (server-side filtering)
  const colunasUsuarios: ColumnDef<UserListItem>[] = useMemo(
    () => [
      {
        id: "username",
        header: createFilterableHeader<UserListItem>({
          title: "Usuário",
          filterType: "text",
          filterPlaceholder: "Buscar nome...",
          wide: true,
        }),
        accessorKey: "username",
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
        }),
        accessorKey: "email",
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
        id: "detalhes",
        header: createFilterableHeader<UserListItem>({
          title: "Detalhes",
          filterType: "text",
          filterPlaceholder: "Buscar depto/curso...",
          wide: true,
        }),
        accessorKey: "professorProfile.departamentoId",
        cell: ({ row }) => {
          const user = row.original

          if (user.role === PROFESSOR && user.professorProfile) {
            const dept = departamentos?.find((d) => d.id === user.professorProfile?.departamentoId)
            return (
              <div className="text-sm">
                <div>{dept?.nome || "N/A"}</div>
                <div className="text-xs text-muted-foreground">
                  {user.professorProfile.regime || "-"}
                  {user.professorProfile.matriculaSiape && ` / SIAPE: ${user.professorProfile.matriculaSiape}`}
                </div>
              </div>
            )
          }

          if (user.role === STUDENT && user.studentProfile) {
            return (
              <div className="text-sm">
                <div>{user.studentProfile.cursoNome || "N/A"}</div>
                <div className="text-xs text-muted-foreground">
                  Mat: {user.studentProfile.matricula || "-"} / CR: {user.studentProfile.cr?.toFixed(2) || "-"}
                </div>
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetClick(user)}
                  disabled={generateResetLinkMutation.isPending}
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  Redefinir senha
                </Button>
              )}
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
    [departamentos, departamentoFilterOptions, deleteUserMutation.isPending, generateResetLinkMutation.isPending]
  )

  const getUserDisplayName = (user: UserListItem) => {
    return user.professorProfile?.nomeCompleto || user.studentProfile?.nomeCompleto || formatUsernameToProperName(user.username)
  }

  return (
    <PagesLayout title="Gerenciar Usuários" subtitle="Administração de usuários do sistema">
      {loadingUsers && !usersData ? (
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
                <p className="text-xs text-muted-foreground">Na página atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats.students}</div>
                <p className="text-xs text-muted-foreground">Na página atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <UserCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
                <p className="text-xs text-muted-foreground">Na página atual</p>
              </CardContent>
            </Card>
          </div>

          <TableComponent
            columns={colunasUsuarios}
            data={usersData?.users || []}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            isLoading={loadingUsers}
            serverPagination={{
              totalCount: usersData?.total ?? 0,
              pageIndex: page,
              pageSize,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
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

      {/* Password Reset Link Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={handleResetDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Gere um link de redefinição para <strong>{userToReset ? getUserDisplayName(userToReset) : ""}</strong> (
              {userToReset?.email}). O usuário escolhe a nova senha; você nunca tem acesso a ela.
            </DialogDescription>
          </DialogHeader>

          {generatedReset ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium mb-2">Copie o link agora</p>
                <p className="text-yellow-700 text-sm">
                  Ao fechar esta janela o link não poderá ser exibido novamente. Ele expira em 15 minutos e deve ser
                  entregue diretamente à pessoa.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Link de redefinição</Label>
                <div className="flex items-center space-x-2">
                  <Input value={generatedReset.resetLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyResetLink(generatedReset.resetLink)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {generatedReset.emailSent
                  ? "Também enviamos o link por e-mail."
                  : "Não foi possível enviar por e-mail. Entregue o link diretamente à pessoa."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetMotivo">Motivo</Label>
                <Textarea
                  id="resetMotivo"
                  placeholder="Ex: aluno relatou que não recebe o e-mail de redefinição"
                  value={resetMotivo}
                  onChange={(e) => setResetMotivo(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Obrigatório e registrado no log de auditoria (mínimo 5 caracteres).
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                O link expira em 15 minutos e deve ser entregue diretamente à pessoa.
              </p>
            </div>
          )}

          <DialogFooter>
            {generatedReset ? (
              <Button onClick={() => handleResetDialogChange(false)}>Fechar</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleResetDialogChange(false)}
                  disabled={generateResetLinkMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateResetLink}
                  disabled={generateResetLinkMutation.isPending || resetMotivo.trim().length < 5}
                >
                  {generateResetLinkMutation.isPending ? "Gerando..." : "Gerar link"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
