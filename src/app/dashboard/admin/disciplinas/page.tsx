"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Disciplina = {
  id: number
  nome: string
  codigo: string
  departamento: {
    id: number
    nome: string
    sigla: string | null
  }
  createdAt: Date
}

export default function DisciplinasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    departamentoId: "",
  })

  const utils = api.useUtils()
  const { data: disciplinas, isLoading } = api.disciplina.list.useQuery({ departamentoId: undefined })
  const { data: departamentos } = api.departamento.list.useQuery()

  const createDisciplina = api.disciplina.create.useMutation({
    onSuccess: () => {
      toast.success("Disciplina criada com sucesso!")
      utils.disciplina.list.invalidate()
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error("Erro ao criar disciplina", {
        description: error.message,
      })
    },
  })

  const updateDisciplina = api.disciplina.update.useMutation({
    onSuccess: () => {
      toast.success("Disciplina atualizada com sucesso!")
      utils.disciplina.list.invalidate()
      setIsDialogOpen(false)
      setEditingDisciplina(null)
      resetForm()
    },
    onError: (error) => {
      toast.error("Erro ao atualizar disciplina", {
        description: error.message,
      })
    },
  })

  const deleteDisciplina = api.disciplina.delete.useMutation({
    onSuccess: () => {
      toast.success("Disciplina excluída com sucesso!")
      utils.disciplina.list.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao excluir disciplina", {
        description: error.message,
      })
    },
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      departamentoId: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim() || !formData.codigo.trim() || !formData.departamentoId) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (editingDisciplina) {
      updateDisciplina.mutate({
        id: editingDisciplina.id,
        nome: formData.nome.trim(),
        codigo: formData.codigo.trim(),
        departamentoId: Number(formData.departamentoId),
      })
    } else {
      createDisciplina.mutate({
        nome: formData.nome.trim(),
        codigo: formData.codigo.trim(),
        departamentoId: Number(formData.departamentoId),
      })
    }
  }

  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina)
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      departamentoId: String(disciplina.departamento.id),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (disciplina: Disciplina) => {
    if (confirm(`Tem certeza que deseja excluir a disciplina "${disciplina.nome}"?`)) {
      deleteDisciplina.mutate({ id: disciplina.id })
    }
  }

  const handleNewDisciplina = () => {
    setEditingDisciplina(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Disciplina>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => <div className="font-mono font-medium">{row.original.codigo}</div>,
    },
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => <div className="font-medium">{row.original.nome}</div>,
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
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{format(new Date(row.original.createdAt), "dd/MM/yyyy")}</div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const disciplina = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(disciplina)} title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(disciplina)}
              disabled={deleteDisciplina.isPending}
              title="Excluir"
            >
              {deleteDisciplina.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout
      title="Disciplinas"
      subtitle="Gerencie as disciplinas dos departamentos"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewDisciplina}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDisciplina ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
              <DialogDescription>
                {editingDisciplina ? "Edite as informações da disciplina" : "Adicione uma nova disciplina ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código da Disciplina *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="MAT001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Disciplina *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Cálculo I"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
                <Select
                  value={formData.departamentoId}
                  onValueChange={(value) => setFormData({ ...formData, departamentoId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos?.map((departamento) => (
                      <SelectItem key={departamento.id} value={String(departamento.id)}>
                        {departamento.sigla ? `${departamento.sigla} - ${departamento.nome}` : departamento.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createDisciplina.isPending || updateDisciplina.isPending}>
                  {createDisciplina.isPending || updateDisciplina.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingDisciplina ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Lista de Disciplinas</CardTitle>
          <CardDescription>Todas as disciplinas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando disciplinas...</span>
            </div>
          ) : disciplinas && disciplinas.length > 0 ? (
            <DataTable columns={columns} data={disciplinas} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma disciplina cadastrada.</p>
              <Button className="mt-4" onClick={handleNewDisciplina}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira disciplina
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
