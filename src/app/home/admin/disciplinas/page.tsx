"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DisciplinaListItem } from "@/types"
import { api } from "@/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { BookOpen, Edit, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DisciplinasPage() {
  const { toast } = useToast()

  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDisciplina, setEditingDisciplina] = useState<DisciplinaListItem | null>(null)
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    turma: "",
    departamentoId: "",
  })

  const { data: disciplinas, isLoading } = api.discipline.getDisciplines.useQuery()
  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })

  const createMutation = api.discipline.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Disciplina criada com sucesso!",
      })
      queryClient.invalidateQueries()
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar disciplina: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const updateMutation = api.discipline.updateDiscipline.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Disciplina atualizada com sucesso!",
      })
      queryClient.invalidateQueries()
      setEditingDisciplina(null)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar disciplina: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const deleteMutation = api.discipline.deleteDiscipline.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Disciplina excluída com sucesso!",
      })
      queryClient.invalidateQueries()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir disciplina: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setFormData({
      codigo: "",
      nome: "",
      turma: "",
      departamentoId: "",
    })
  }

  const handleCreate = () => {
    createMutation.mutate({
      codigo: formData.codigo,
      nome: formData.nome,
      turma: formData.turma,
      departamentoId: parseInt(formData.departamentoId),
    })
  }

  const handleUpdate = () => {
    if (!editingDisciplina) return
    updateMutation.mutate({
      id: editingDisciplina.id,
      codigo: formData.codigo,
      nome: formData.nome,
      turma: formData.turma,
      departamentoId: parseInt(formData.departamentoId),
    })
  }

  const handleEdit = (disciplina: DisciplinaListItem) => {
    setEditingDisciplina(disciplina)
    setFormData({
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      turma: disciplina.turma,
      departamentoId: disciplina.departamentoId.toString(),
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta disciplina?")) {
      deleteMutation.mutate({ id })
    }
  }

  const columns: ColumnDef<DisciplinaListItem>[] = [
    {
      header: "Código",
      accessorKey: "codigo",
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.codigo}</span>,
    },
    {
      header: "Turma",
      accessorKey: "turma",
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.turma}</span>,
    },
    {
      header: "Nome",
      accessorKey: "nome",
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      header: "Departamento",
      accessorKey: "departamentoId",
      cell: ({ row }) => {
        const dept = departamentos?.find((d) => d.id === row.original.departamentoId)
        return dept?.nome || "N/A"
      },
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const actions = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => resetForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Disciplina
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Disciplina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="Ex: MAT001"
            />
          </div>
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Matemática I"
            />
          </div>
          <div>
            <Label htmlFor="turma">Turma</Label>
            <Select value={formData.turma} onValueChange={(value) => setFormData({ ...formData, turma: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={`T${num}`} value={`T${num}`}>
                    T{num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="departamento">Departamento</Label>
            <Select
              value={formData.departamentoId}
              onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
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
          <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Criando..." : "Criar Disciplina"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <PagesLayout title="Disciplinas" subtitle="Gerencie as disciplinas do sistema" actions={actions}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lista de Disciplinas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Carregando disciplinas...</p>
              </div>
            </div>
          ) : (
            <TableComponent
              columns={columns}
              data={disciplinas || []}
              searchableColumn="nome"
              searchPlaceholder="Buscar por nome da disciplina..."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDisciplina} onOpenChange={() => setEditingDisciplina(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-codigo">Código</Label>
              <Input
                id="edit-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: MAT001"
              />
            </div>
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Matemática I"
              />
            </div>
            <div>
              <Label htmlFor="edit-departamento">Departamento</Label>
              <Select
                value={formData.departamentoId}
                onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
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
            <Button onClick={handleUpdate} className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Atualizando..." : "Atualizar Disciplina"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
