"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import {
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

const roleLabels = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.PROFESSOR]: "Professor",
  [UserRole.STUDENT]: "Estudante",
}

const roleColors = {
  [UserRole.ADMIN]: "destructive",
  [UserRole.PROFESSOR]: "default",
  [UserRole.STUDENT]: "secondary",
} as const

interface UserDetails {
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

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const [viewingUser, setViewingUser] = useState<UserDetails | null>(null)
  const [editingUser, setEditingUser] = useState<UserDetails | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserDetails | null>(null)

  const [editFormData, setEditFormData] = useState({
    role: UserRole.STUDENT,
  })

  const {
    data: usersData,
    isLoading,
    refetch,
  } = api.user.list.useQuery({
    search: searchTerm || undefined,
    role: roleFilter !== "all" ? (roleFilter as UserRole) : undefined,
    page: currentPage,
    limit: 20,
  })

  const { data: stats } = api.user.getStats.useQuery()

  const updateUserMutation = api.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Função do usuário atualizada com sucesso!")
      setEditingUser(null)
      refetch()
    },
    onError: (error) => {
      toast.error("Erro ao atualizar função do usuário", { description: error.message })
    },
  })

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!")
      setDeletingUser(null)
      refetch()
    },
    onError: (error) => {
      toast.error("Erro ao excluir usuário", { description: error.message })
    },
  })

  const users = usersData?.users || []
  const totalUsers = usersData?.total || 0
  const totalPages = Math.ceil(totalUsers / 20)

  const handleViewUser = (user: UserDetails) => {
    setViewingUser(user)
  }

  const handleEditUser = (user: UserDetails) => {
    setEditingUser(user)
    setEditFormData({
      role: user.role,
    })
  }

  const handleSaveEdit = () => {
    if (!editingUser) return

    updateUserMutation.mutate({
      id: editingUser.id,
      newRole: editFormData.role,
    })
  }

  const handleDeleteUser = () => {
    if (!deletingUser) return

    deleteUserMutation.mutate({ id: deletingUser.id })
  }

  const pageActions = (
    <div className="flex gap-2">
      <Link href="/dashboard/admin/convidar">
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Professor
        </Button>
      </Link>
    </div>
  )

  return (
    <PagesLayout
      title="Gestão de Usuários"
      subtitle="Gerencie usuários, professores e estudantes do sistema"
      actions={pageActions}
    >
      <div className="space-y-6">
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.withProfiles?.professors || 0} profs. e {stats.withProfiles?.students || 0} alunos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Professores</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withProfiles?.professors || 0}</div>
                <p className="text-xs text-muted-foreground">Com perfil completo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withProfiles?.students || 0}</div>
                <p className="text-xs text-muted-foreground">Com perfil completo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos (30 dias)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentlyCreated || 0}</div>
                <p className="text-xs text-muted-foreground">Cadastros recentes</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
            <CardDescription>Busque usuários por nome, email ou filtre por tipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, username ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administradores</SelectItem>
                  <SelectItem value={UserRole.PROFESSOR}>Professores</SelectItem>
                  <SelectItem value={UserRole.STUDENT}>Estudantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || roleFilter !== "all"
                  ? "Nenhum usuário corresponde aos filtros aplicados."
                  : "Não há usuários cadastrados no sistema."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {(user.profile?.nomeCompleto || user.username)?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{user.profile?.nomeCompleto || user.username}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge variant={roleColors[user.role]} className="text-xs">
                        {roleLabels[user.role]}
                      </Badge>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeletingUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * 20 + 1} a {Math.min(currentPage * 20, totalUsers)} de {totalUsers}{" "}
                  usuários
                </p>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View User Modal */}
        <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription>Informações do usuário selecionado</DialogDescription>
            </DialogHeader>

            {viewingUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {(viewingUser.profile?.nomeCompleto || viewingUser.username)?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {viewingUser.profile?.nomeCompleto || viewingUser.username}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={roleColors[viewingUser.role]}>{roleLabels[viewingUser.role]}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informações Básicas
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span>@{viewingUser.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{viewingUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription>Atualize a função do usuário</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={editingUser?.username || ""} disabled />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editingUser?.email || ""} disabled />
              </div>

              <div>
                <Label htmlFor="role">Função</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={UserRole.PROFESSOR}>Professor</SelectItem>
                    <SelectItem value={UserRole.STUDENT}>Estudante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Modal */}
        <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
              </DialogDescription>
            </DialogHeader>

            {deletingUser && (
              <div className="py-4">
                <p className="text-sm">Você está prestes a excluir o usuário:</p>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-semibold">{deletingUser.profile?.nomeCompleto || deletingUser.username}</p>
                  <p className="text-sm text-muted-foreground">{deletingUser.email}</p>
                  <Badge variant={roleColors[deletingUser.role]} className="mt-1">
                    {roleLabels[deletingUser.role]}
                  </Badge>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingUser(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteUserMutation.isPending}>
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Usuário
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
