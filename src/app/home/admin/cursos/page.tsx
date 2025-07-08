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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CursoListItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { BookOpen, Edit, GraduationCap, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"

export default function CursosPage() {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCurso, setSelectedCurso] = useState<CursoListItem | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    tipo: "" as "BACHARELADO" | "LICENCIATURA" | "TECNICO" | "POS_GRADUACAO" | "",
    modalidade: "" as "PRESENCIAL" | "EAD" | "HIBRIDO" | "",
    duracao: 8,
    cargaHoraria: 3000,
    descricao: "",
    departamentoId: "",
    coordenador: "",
    emailCoordenacao: "",
  })

  // Fetch courses and departments data
  const { data: cursosData, isLoading } = api.course.getCourses.useQuery({
    includeStats: true,
  })
  const { data: departamentosData } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const apiUtils = api.useUtils()
  const createCursoMutation = api.course.createCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate()
    },
  })
  const updateCursoMutation = api.course.updateCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate()
    },
  })
  const deleteCursoMutation = api.course.deleteCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate()
    },
  })

  const departamentos = departamentosData || []

  const cursos: CursoListItem[] =
    cursosData?.map((curso) => ({
      id: curso.id,
      nome: curso.nome,
      codigo: curso.codigo.toString(),
      tipo: curso.tipo || ("BACHARELADO" as const),
      modalidade: curso.modalidade || ("PRESENCIAL" as const),
      duracao: curso.duracao || 8,
      cargaHoraria: curso.cargaHoraria,
      descricao: curso.descricao || undefined,
      departamento: {
        id: curso.departamentoId,
        nome: departamentos.find((d) => d.id === curso.departamentoId)?.nome || "N/A",
        sigla: departamentos.find((d) => d.id === curso.departamentoId)?.sigla || "N/A",
      },
      coordenador: curso.coordenador || undefined,
      emailCoordenacao: curso.emailCoordenacao || undefined,
      alunos: 0,
      disciplinas: 0,
      projetos: 0,
      status: (curso.status || "ATIVO") as "ATIVO" | "INATIVO" | "EM_REFORMULACAO",
      criadoEm: curso.createdAt.toISOString(),
      atualizadoEm: curso.updatedAt?.toISOString() || curso.createdAt.toISOString(),
    })) || []

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      tipo: "",
      modalidade: "",
      duracao: 8,
      cargaHoraria: 3000,
      descricao: "",
      departamentoId: "",
      coordenador: "",
      emailCoordenacao: "",
    })
  }

  const handleCreate = async () => {
    try {
      if (!formData.nome || !formData.codigo || !formData.tipo || !formData.modalidade || !formData.departamentoId) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      await createCursoMutation.mutateAsync({
        nome: formData.nome,
        codigo: parseInt(formData.codigo),
        tipo: formData.tipo,
        modalidade: formData.modalidade,
        duracao: formData.duracao,
        departamentoId: parseInt(formData.departamentoId),
        cargaHoraria: formData.cargaHoraria,
        descricao: formData.descricao || undefined,
        coordenador: formData.coordenador || undefined,
        emailCoordenacao: formData.emailCoordenacao || undefined,
      })

      toast({
        title: "Curso criado",
        description: `Curso ${formData.nome} criado com sucesso`,
      })

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Erro ao criar curso",
        description: error.message || "Não foi possível criar o curso",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (curso: CursoListItem) => {
    setSelectedCurso(curso)
    setFormData({
      nome: curso.nome,
      codigo: curso.codigo,
      tipo: curso.tipo,
      modalidade: curso.modalidade,
      duracao: curso.duracao,
      cargaHoraria: curso.cargaHoraria,
      descricao: curso.descricao || "",
      departamentoId: curso.departamento.id.toString(),
      coordenador: curso.coordenador || "",
      emailCoordenacao: curso.emailCoordenacao || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    try {
      if (!formData.nome || !formData.codigo || !formData.tipo || !formData.modalidade || !formData.departamentoId) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      await updateCursoMutation.mutateAsync({
        id: selectedCurso!.id,
        nome: formData.nome,
        codigo: parseInt(formData.codigo),
        tipo: formData.tipo,
        modalidade: formData.modalidade,
        duracao: formData.duracao,
        departamentoId: parseInt(formData.departamentoId),
        cargaHoraria: formData.cargaHoraria,
        descricao: formData.descricao || undefined,
        coordenador: formData.coordenador || undefined,
        emailCoordenacao: formData.emailCoordenacao || undefined,
      })

      toast({
        title: "Curso atualizado",
        description: `Curso ${formData.nome} atualizado com sucesso`,
      })

      setIsEditDialogOpen(false)
      resetForm()
      setSelectedCurso(null)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message || "Não foi possível atualizar o curso",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (curso: CursoListItem) => {
    setSelectedCurso(curso)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteCursoMutation.mutateAsync({ id: selectedCurso!.id })

      toast({
        title: "Curso excluído",
        description: `Curso ${selectedCurso!.nome} excluído com sucesso`,
      })

      setIsDeleteDialogOpen(false)
      setSelectedCurso(null)
    } catch (error: any) {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Não foi possível excluir o curso",
        variant: "destructive",
      })
    }
  }

  const renderTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "BACHARELADO":
        return <Badge className="bg-blue-100 text-blue-800">Bacharelado</Badge>
      case "LICENCIATURA":
        return <Badge className="bg-green-100 text-green-800">Licenciatura</Badge>
      case "TECNICO":
        return <Badge className="bg-orange-100 text-orange-800">Técnico</Badge>
      case "POS_GRADUACAO":
        return <Badge className="bg-purple-100 text-purple-800">Pós-Graduação</Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  const renderModalidadeBadge = (modalidade: string) => {
    switch (modalidade) {
      case "PRESENCIAL":
        return <Badge variant="default">Presencial</Badge>
      case "EAD":
        return <Badge variant="secondary">EAD</Badge>
      case "HIBRIDO":
        return <Badge variant="outline">Híbrido</Badge>
      default:
        return <Badge variant="outline">{modalidade}</Badge>
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "INATIVO":
        return <Badge variant="destructive">Inativo</Badge>
      case "EM_REFORMULACAO":
        return <Badge className="bg-yellow-100 text-yellow-800">Em Reformulação</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<CursoListItem>[] = [
    {
      accessorKey: "nome",
      header: "Curso",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.codigo} • {row.original.departamento.sigla}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => renderTipoBadge(row.original.tipo),
    },
    {
      accessorKey: "modalidade",
      header: "Modalidade",
      cell: ({ row }) => renderModalidadeBadge(row.original.modalidade),
    },
    {
      accessorKey: "duracao",
      header: "Duração",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.duracao} sem.</Badge>
        </div>
      ),
    },
    {
      accessorKey: "alunos",
      header: "Alunos",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.alunos}</Badge>
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
        const curso = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(curso)}>
              <Edit className="h-4 w-4" />
            </Button>

            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(curso)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const totalCursos = cursos.length
  const cursosAtivos = cursos.filter((c) => c.status === "ATIVO").length
  const totalAlunos = cursos.reduce((sum, c) => sum + c.alunos, 0)
  const totalDisciplinas = cursos.reduce((sum, c) => sum + c.disciplinas, 0)

  return (
    <PagesLayout title="Gerenciamento de Cursos" subtitle="Gerencie cursos e suas informações">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
                  <div className="text-2xl font-bold">{totalCursos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <div className="text-2xl font-bold text-green-600">{cursosAtivos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                  <div className="text-2xl font-bold text-blue-600">{totalAlunos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Disciplinas</p>
                  <div className="text-2xl font-bold text-purple-600">{totalDisciplinas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Cursos</h2>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Curso</DialogTitle>
                <DialogDescription>Preencha as informações do novo curso</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Curso *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Ciência da Computação"
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      placeholder="12"
                      type="number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BACHARELADO">Bacharelado</SelectItem>
                        <SelectItem value="LICENCIATURA">Licenciatura</SelectItem>
                        <SelectItem value="TECNICO">Técnico</SelectItem>
                        <SelectItem value="POS_GRADUACAO">Pós-Graduação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modalidade">Modalidade *</Label>
                    <Select
                      value={formData.modalidade}
                      onValueChange={(value: any) => setFormData({ ...formData, modalidade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="EAD">EAD</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="departamento">Departamento *</Label>
                  <Select
                    value={formData.departamentoId}
                    onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dep) => (
                        <SelectItem key={dep.id} value={dep.id.toString()}>
                          {dep.nome} ({dep.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duracao">Duração (semestres)</Label>
                    <Input
                      id="duracao"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.duracao}
                      onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 8 })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
                    <Input
                      id="cargaHoraria"
                      type="number"
                      min="1"
                      value={formData.cargaHoraria}
                      onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) || 3000 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coordenador">Coordenador</Label>
                    <Input
                      id="coordenador"
                      value={formData.coordenador}
                      onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
                      placeholder="Nome do coordenador"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailCoordenacao">Email da Coordenação</Label>
                    <Input
                      id="emailCoordenacao"
                      type="email"
                      value={formData.emailCoordenacao}
                      onChange={(e) => setFormData({ ...formData, emailCoordenacao: e.target.value })}
                      placeholder="coord.curso@ufba.br"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do curso..."
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
                <Button onClick={handleCreate}>Criar Curso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses Table */}
        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={cursos}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome do curso..."
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Editar Curso</DialogTitle>
              <DialogDescription>Atualize as informações do curso</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome do Curso *</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Ciência da Computação"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-codigo">Código *</Label>
                  <Input
                    id="edit-codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: COMP001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BACHARELADO">Bacharelado</SelectItem>
                      <SelectItem value="LICENCIATURA">Licenciatura</SelectItem>
                      <SelectItem value="TECNICO">Técnico</SelectItem>
                      <SelectItem value="POS_GRADUACAO">Pós-Graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-modalidade">Modalidade *</Label>
                  <Select
                    value={formData.modalidade}
                    onValueChange={(value: any) => setFormData({ ...formData, modalidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      <SelectItem value="EAD">EAD</SelectItem>
                      <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-departamento">Departamento *</Label>
                <Select
                  value={formData.departamentoId}
                  onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((dep) => (
                      <SelectItem key={dep.id} value={dep.id.toString()}>
                        {dep.nome} ({dep.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duracao">Duração (semestres)</Label>
                  <Input
                    id="edit-duracao"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 8 })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-cargaHoraria">Carga Horária (horas)</Label>
                  <Input
                    id="edit-cargaHoraria"
                    type="number"
                    min="1"
                    value={formData.cargaHoraria}
                    onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) || 3000 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-coordenador">Coordenador</Label>
                  <Input
                    id="edit-coordenador"
                    value={formData.coordenador}
                    onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
                    placeholder="Nome do coordenador"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-emailCoordenacao">Email da Coordenação</Label>
                  <Input
                    id="edit-emailCoordenacao"
                    type="email"
                    value={formData.emailCoordenacao}
                    onChange={(e) => setFormData({ ...formData, emailCoordenacao: e.target.value })}
                    placeholder="coord.curso@ufba.br"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do curso..."
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
                  setSelectedCurso(null)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Atualizar Curso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o curso <span className="font-semibold">{selectedCurso?.nome}</span>?
                Esta ação não pode ser desfeita e pode afetar outros dados relacionados.
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
