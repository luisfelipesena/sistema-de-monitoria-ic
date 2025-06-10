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
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Departamento = {
  id: number
  nome: string
  sigla: string | null
  unidadeUniversitaria: string
  createdAt: Date
}

export default function DepartamentosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
    unidadeUniversitaria: "",
  })

  const utils = api.useUtils()
  const { data: departamentos, isLoading } = api.departamento.list.useQuery()

  const createDepartamento = api.departamento.create.useMutation({
    onSuccess: () => {
      toast.success("Departamento criado com sucesso!")
      utils.departamento.list.invalidate()
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error("Erro ao criar departamento", {
        description: error.message,
      })
    },
  })

  const updateDepartamento = api.departamento.update.useMutation({
    onSuccess: () => {
      toast.success("Departamento atualizado com sucesso!")
      utils.departamento.list.invalidate()
      setIsDialogOpen(false)
      setEditingDepartamento(null)
      resetForm()
    },
    onError: (error) => {
      toast.error("Erro ao atualizar departamento", {
        description: error.message,
      })
    },
  })

  const deleteDepartamento = api.departamento.delete.useMutation({
    onSuccess: () => {
      toast.success("Departamento excluído com sucesso!")
      utils.departamento.list.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao excluir departamento", {
        description: error.message,
      })
    },
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      sigla: "",
      unidadeUniversitaria: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim() || !formData.unidadeUniversitaria.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    if (editingDepartamento) {
      updateDepartamento.mutate({
        id: editingDepartamento.id,
        nome: formData.nome.trim(),
        sigla: formData.sigla.trim() || undefined,
        unidadeUniversitaria: formData.unidadeUniversitaria.trim(),
      })
    } else {
      createDepartamento.mutate({
        nome: formData.nome.trim(),
        sigla: formData.sigla.trim() || undefined,
        unidadeUniversitaria: formData.unidadeUniversitaria.trim(),
      })
    }
  }

  const handleEdit = (departamento: Departamento) => {
    setEditingDepartamento(departamento)
    setFormData({
      nome: departamento.nome,
      sigla: departamento.sigla || "",
      unidadeUniversitaria: departamento.unidadeUniversitaria,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (departamento: Departamento) => {
    if (confirm(`Tem certeza que deseja excluir o departamento "${departamento.nome}"?`)) {
      deleteDepartamento.mutate({ id: departamento.id })
    }
  }

  const handleNewDepartamento = () => {
    setEditingDepartamento(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const columns: ColumnDef<Departamento>[] = [
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => <div className="font-medium">{row.original.nome}</div>,
    },
    {
      accessorKey: "sigla",
      header: "Sigla",
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.sigla || "-"}</div>,
    },
    {
      accessorKey: "unidadeUniversitaria",
      header: "Unidade Universitária",
      cell: ({ row }) => <div>{row.original.unidadeUniversitaria}</div>,
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
        const departamento = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(departamento)} title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(departamento)}
              disabled={deleteDepartamento.isPending}
              title="Excluir"
            >
              {deleteDepartamento.isPending ? (
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
      title="Departamentos"
      subtitle="Gerencie os departamentos da universidade"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewDepartamento}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDepartamento ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
              <DialogDescription>
                {editingDepartamento
                  ? "Edite as informações do departamento"
                  : "Adicione um novo departamento à universidade"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Departamento *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Departamento de Ciência da Computação"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla</Label>
                <Input
                  id="sigla"
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                  placeholder="DCC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidadeUniversitaria">Unidade Universitária *</Label>
                <Input
                  id="unidadeUniversitaria"
                  value={formData.unidadeUniversitaria}
                  onChange={(e) => setFormData({ ...formData, unidadeUniversitaria: e.target.value })}
                  placeholder="Instituto de Computação"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createDepartamento.isPending || updateDepartamento.isPending}>
                  {createDepartamento.isPending || updateDepartamento.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingDepartamento ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>Todos os departamentos cadastrados na universidade</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando departamentos...</span>
            </div>
          ) : departamentos && departamentos.length > 0 ? (
            <DataTable columns={columns} data={departamentos} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum departamento cadastrado.</p>
              <Button className="mt-4" onClick={handleNewDepartamento}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro departamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
