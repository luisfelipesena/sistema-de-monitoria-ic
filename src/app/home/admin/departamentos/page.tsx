"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DepartamentoListItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { Building, Edit, GraduationCap, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"

export default function DepartamentosPage() {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDepartamento, setSelectedDepartamento] = useState<DepartamentoListItem | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
    descricao: "",
    instituto: "",
    coordenador: "",
    email: "",
    telefone: "",
  })

  // Fetch departments data with statistics
  const { data: departamentosData, isLoading } = api.departamento.getDepartamentos.useQuery({
    includeStats: true,
  })
  const apiUtils = api.useUtils()
  const createDepartamentoMutation = api.departamento.createDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.departamento.getDepartamentos.invalidate()
    },
  })
  const updateDepartamentoMutation = api.departamento.updateDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.departamento.getDepartamentos.invalidate()
    },
  })
  const deleteDepartamentoMutation = api.departamento.deleteDepartamento.useMutation({
    onSuccess: () => {
      apiUtils.departamento.getDepartamentos.invalidate()
    },
  })

  const departamentos: DepartamentoListItem[] =
    departamentosData?.map((dept) => ({
      id: dept.id,
      nome: dept.nome,
      sigla: dept.sigla || "",
      descricao: dept.descricao || undefined,
      instituto: dept.unidadeUniversitaria,
      coordenador: dept.coordenador || undefined,
      email: dept.email || undefined,
      telefone: dept.telefone || undefined,
      professores: dept.professores || 0,
      cursos: dept.cursos || 0,
      disciplinas: dept.disciplinas || 0,
      projetos: dept.projetos || 0,
      status: dept.professores && dept.professores > 0 ? "ATIVO" : ("INATIVO" as const),
      criadoEm: dept.createdAt.toISOString(),
      atualizadoEm: dept.updatedAt?.toISOString() || dept.createdAt.toISOString(),
    })) || []

  const resetForm = () => {
    setFormData({
      nome: "",
      sigla: "",
      descricao: "",
      instituto: "",
      coordenador: "",
      email: "",
      telefone: "",
    })
  }

  const handleCreate = async () => {
    try {
      if (!formData.nome || !formData.sigla) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o nome e a sigla do departamento",
          variant: "destructive",
        })
        return
      }

      await createDepartamentoMutation.mutateAsync({
        nome: formData.nome,
        sigla: formData.sigla,
        unidadeUniversitaria: formData.instituto || "UFBA",
        coordenador: formData.coordenador || undefined,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        descricao: formData.descricao || undefined,
      })

      toast({
        title: "Departamento criado",
        description: `Departamento ${formData.nome} criado com sucesso`,
      })

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        description: error.message || "Não foi possível criar o departamento",
        title: "Erro ao criar departamento",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (departamento: DepartamentoListItem) => {
    setSelectedDepartamento(departamento)
    setFormData({
      nome: departamento.nome,
      sigla: departamento.sigla,
      descricao: departamento.descricao || "",
      instituto: departamento.instituto || "",
      coordenador: departamento.coordenador || "",
      email: departamento.email || "",
      telefone: departamento.telefone || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    try {
      if (!formData.nome || !formData.sigla) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o nome e a sigla do departamento",
          variant: "destructive",
        })
        return
      }

      await updateDepartamentoMutation.mutateAsync({
        id: selectedDepartamento!.id,
        nome: formData.nome,
        sigla: formData.sigla,
        unidadeUniversitaria: formData.instituto || "UFBA",
        coordenador: formData.coordenador || undefined,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        descricao: formData.descricao || undefined,
      })

      toast({
        title: "Departamento atualizado",
        description: `Departamento ${formData.nome} atualizado com sucesso`,
      })

      setIsEditDialogOpen(false)
      resetForm()
      setSelectedDepartamento(null)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar departamento",
        description: error.message || "Não foi possível atualizar o departamento",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (departamento: DepartamentoListItem) => {
    setSelectedDepartamento(departamento)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteDepartamentoMutation.mutateAsync({ id: selectedDepartamento!.id })

      toast({
        title: "Departamento excluído",
        description: `Departamento ${selectedDepartamento!.nome} excluído com sucesso`,
      })

      setIsDeleteDialogOpen(false)
      setSelectedDepartamento(null)
    } catch (error: any) {
      toast({
        title: "Erro ao excluir departamento",
        description: error.message || "Não foi possível excluir o departamento",
        variant: "destructive",
      })
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "INATIVO":
        return <Badge variant="destructive">Inativo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<DepartamentoListItem>[] = [
    {
      accessorKey: "nome",
      header: "Departamento",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.sigla} • {row.original.instituto}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "coordenador",
      header: "Coordenador",
      cell: ({ row }) => <div className="text-sm">{row.original.coordenador || "-"}</div>,
    },
    {
      accessorKey: "professores",
      header: "Professores",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.professores}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "cursos",
      header: "Cursos",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.cursos}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "disciplinas",
      header: "Disciplinas",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.disciplinas}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "projetos",
      header: "Projetos",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.projetos}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const departamento = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(departamento)}>
              <Edit className="h-4 w-4" />
            </Button>

            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(departamento)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const totalDepartamentos = departamentos.length
  const departamentosAtivos = departamentos.filter((d) => d.status === "ATIVO").length
  const totalProfessores = departamentos.reduce((sum, d) => sum + d.professores, 0)
  const totalCursos = departamentos.reduce((sum, d) => sum + d.cursos, 0)

  return (
    <PagesLayout title="Gerenciamento de Departamentos" subtitle="Gerencie departamentos e suas informações">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Departamentos</p>
                  <div className="text-2xl font-bold">{totalDepartamentos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Building className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <div className="text-2xl font-bold text-green-600">{departamentosAtivos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Professores</p>
                  <div className="text-2xl font-bold text-blue-600">{totalProfessores}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
                  <div className="text-2xl font-bold text-purple-600">{totalCursos}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Departamentos</h2>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Departamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Departamento</DialogTitle>
                <DialogDescription>Preencha as informações do novo departamento</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Departamento *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Ciência da Computação"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sigla">Sigla *</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                      placeholder="Ex: DCC"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instituto">Instituto</Label>
                  <Input
                    id="instituto"
                    value={formData.instituto}
                    onChange={(e) => setFormData({ ...formData, instituto: e.target.value })}
                    placeholder="Ex: Instituto de Matemática e Estatística"
                  />
                </div>

                <div>
                  <Label htmlFor="coordenador">Coordenador</Label>
                  <Input
                    id="coordenador"
                    value={formData.coordenador}
                    onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
                    placeholder="Nome do coordenador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="departamento@ufba.br"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(71) 3283-6800"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do departamento..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Criar Departamento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Table */}
        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={departamentos}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome do departamento..."
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Departamento</DialogTitle>
              <DialogDescription>Atualize as informações do departamento</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome do Departamento *</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Ciência da Computação"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-sigla">Sigla *</Label>
                  <Input
                    id="edit-sigla"
                    value={formData.sigla}
                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: DCC"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-instituto">Instituto</Label>
                <Input
                  id="edit-instituto"
                  value={formData.instituto}
                  onChange={(e) => setFormData({ ...formData, instituto: e.target.value })}
                  placeholder="Ex: Instituto de Matemática e Estatística"
                />
              </div>

              <div>
                <Label htmlFor="edit-coordenador">Coordenador</Label>
                <Input
                  id="edit-coordenador"
                  value={formData.coordenador}
                  onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
                  placeholder="Nome do coordenador"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="departamento@ufba.br"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(71) 3283-6800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do departamento..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                  setSelectedDepartamento(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Atualizar Departamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o departamento{" "}
                <span className="font-semibold">{selectedDepartamento?.nome}</span>? Esta ação não pode ser desfeita e
                pode afetar outros dados relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PagesLayout>
  )
}
