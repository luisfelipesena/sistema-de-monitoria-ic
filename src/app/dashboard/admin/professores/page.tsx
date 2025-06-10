"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { Building, GraduationCap, Loader2, Mail, Pencil, Search, User, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

type ProfessorWithProfile = {
  id: number
  userId: number
  nomeCompleto: string
  emailInstitucional: string
  telefone: string | null
  telefoneInstitucional: string | null
  regime: string
  matriculaSiape: string | null
  departamento: {
    id: number
    nome: string
    sigla: string | null
  }
  user: {
    id: number
    username: string
    email: string
    role: UserRole
    isActive: boolean
  }
  totalProjetos: number
  projetosAtivos: number
}

interface EditProfessorData {
  nomeCompleto: string
  emailInstitucional: string
  telefone: string
  telefoneInstitucional: string
  departamentoId: number
}

export default function ProfessoresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [regimeFilter, setRegimeFilter] = useState<string>("all")
  const [editingProfessor, setEditingProfessor] = useState<ProfessorWithProfile | null>(null)
  const [editFormData, setEditFormData] = useState<EditProfessorData>({
    nomeCompleto: "",
    emailInstitucional: "",
    telefone: "",
    telefoneInstitucional: "",
    departamentoId: 0,
  })

  const {
    data: professores,
    isLoading: professoresLoading,
    refetch,
  } = api.professor.list.useQuery({
    search: searchTerm || undefined,
    departamentoId: departmentFilter !== "all" ? parseInt(departmentFilter) : undefined,
    regime: regimeFilter !== "all" ? regimeFilter : undefined,
  })

  const { data: departamentos } = api.departamento.list.useQuery()

  const updateProfessorMutation = api.professor.update.useMutation({
    onSuccess: () => {
      toast.success("Professor atualizado com sucesso!")
      setEditingProfessor(null)
      refetch()
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar professor", {
        description: error.message,
      })
    },
  })

  const handleEditClick = (professor: ProfessorWithProfile) => {
    setEditingProfessor(professor)
    setEditFormData({
      nomeCompleto: professor.nomeCompleto,
      emailInstitucional: professor.emailInstitucional,
      telefone: professor.telefone || "",
      telefoneInstitucional: professor.telefoneInstitucional || "",
      departamentoId: professor.departamento.id,
    })
  }

  const handleSaveEdit = () => {
    if (!editingProfessor) return

    updateProfessorMutation.mutate({
      professorId: editingProfessor.id,
      ...editFormData,
    })
  }

  const columns: ColumnDef<ProfessorWithProfile>[] = [
    {
      accessorKey: "nomeCompleto",
      header: "Professor",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{row.original.nomeCompleto}</div>
            <div className="text-sm text-muted-foreground">{row.original.user.email}</div>
            <div className="text-xs text-muted-foreground">SIAPE: {row.original.matriculaSiape || "N/A"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "departamento",
      header: "Departamento",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.departamento.nome}</div>
          {row.original.departamento.sigla && (
            <div className="text-sm text-muted-foreground">{row.original.departamento.sigla}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "regime",
      header: "Regime",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.regime}
        </Badge>
      ),
    },
    {
      accessorKey: "projetos",
      header: "Projetos",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.totalProjetos}</div>
          <div className="text-sm text-muted-foreground">{row.original.projetosAtivos} ativos</div>
        </div>
      ),
    },
    {
      accessorKey: "contato",
      header: "Contato",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{row.original.emailInstitucional}</span>
          </div>
          {row.original.telefone && <div className="text-muted-foreground mt-1">{row.original.telefone}</div>}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.user.isActive ? "default" : "secondary"}>
          {row.original.user.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditClick(row.original)}>
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ]

  const stats = {
    total: professores?.length || 0,
    ativos: professores?.filter((p) => p.user.isActive)?.length || 0,
    comProjetos: professores?.filter((p) => p.totalProjetos > 0)?.length || 0,
    regimes:
      professores?.reduce((acc, p) => {
        const regimeKey = p.regime as keyof typeof acc
        acc[regimeKey] = (acc[regimeKey] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
  }

  return (
    <PagesLayout
      title="Professores"
      subtitle="Gerencie todos os professores do sistema de monitoria"
      actions={
        <Link href="/dashboard/admin/convidar">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Professor
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.ativos} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Projetos</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comProjetos}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.comProjetos / stats.total) * 100) || 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">20 Horas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.regimes["20H"] || 0}</div>
              <p className="text-xs text-muted-foreground">Regime 20h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dedicação Exclusiva</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.regimes.DE || 0}</div>
              <p className="text-xs text-muted-foreground">Regime DE</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre professores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departamentos?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os regimes</SelectItem>
                  <SelectItem value="20H">20 Horas</SelectItem>
                  <SelectItem value="40H">40 Horas</SelectItem>
                  <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Professors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Professores</CardTitle>
            <CardDescription>{professores?.length || 0} professores encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            {professoresLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <DataTable columns={columns} data={professores || []} />
            )}
          </CardContent>
        </Card>

        {/* Edit Professor Dialog */}
        <Dialog open={!!editingProfessor} onOpenChange={(open) => !open && setEditingProfessor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Professor</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <Input
                  id="nomeCompleto"
                  value={editFormData.nomeCompleto}
                  onChange={(e) => setEditFormData({ ...editFormData, nomeCompleto: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="emailInstitucional">Email Institucional</Label>
                <Input
                  id="emailInstitucional"
                  type="email"
                  value={editFormData.emailInstitucional}
                  onChange={(e) => setEditFormData({ ...editFormData, emailInstitucional: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={editFormData.telefone}
                  onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
                <Input
                  id="telefoneInstitucional"
                  value={editFormData.telefoneInstitucional}
                  onChange={(e) => setEditFormData({ ...editFormData, telefoneInstitucional: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={editFormData.departamentoId.toString()}
                  onValueChange={(value) => setEditFormData({ ...editFormData, departamentoId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProfessor(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateProfessorMutation.isPending}>
                {updateProfessorMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
