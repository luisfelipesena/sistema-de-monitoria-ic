"use client"

import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUrlColumnFilters } from "@/hooks/useUrlColumnFilters"
import { DisciplinaListItem } from "@/types"
import { api } from "@/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef, FilterFn } from "@tanstack/react-table"
import { BookOpen, Edit, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

// Custom filter functions
const codigoFilterFn: FilterFn<DisciplinaListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const codigo = row.original.codigo.toLowerCase()
  return codigo.includes(String(filterValue).toLowerCase())
}

const nomeFilterFn: FilterFn<DisciplinaListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const nome = row.original.nome.toLowerCase()
  return nome.includes(String(filterValue).toLowerCase())
}

const departamentoFilterFn: FilterFn<DisciplinaListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true
  const departamentoId = row.original.departamentoId?.toString()
  return departamentoId ? filterValue.includes(departamentoId) : false
}

export default function DisciplinasPage() {
  const { toast } = useToast()

  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDisciplina, setEditingDisciplina] = useState<DisciplinaListItem | null>(null)
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    departamentoId: "",
  })

  // URL-based column filters
  const { columnFilters, setColumnFilters } = useUrlColumnFilters()

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
      departamentoId: "",
    })
  }

  const handleCreate = () => {
    createMutation.mutate({
      codigo: formData.codigo,
      nome: formData.nome,
      departamentoId: parseInt(formData.departamentoId),
    })
  }

  const handleUpdate = () => {
    if (!editingDisciplina) return
    updateMutation.mutate({
      id: editingDisciplina.id,
      codigo: formData.codigo,
      nome: formData.nome,
      departamentoId: parseInt(formData.departamentoId),
    })
  }

  const handleEdit = (disciplina: DisciplinaListItem) => {
    setEditingDisciplina(disciplina)
    setFormData({
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      departamentoId: disciplina.departamentoId.toString(),
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta disciplina?")) {
      deleteMutation.mutate({ id })
    }
  }

  // Generate filter options
  const codigoFilterOptions = useMemo(() => {
    if (!disciplinas) return []
    return disciplinas
      .map((d) => ({ value: d.codigo, label: d.codigo }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [disciplinas])

  const nomeFilterOptions = useMemo(() => {
    if (!disciplinas) return []
    return disciplinas
      .map((d) => ({ value: d.nome, label: d.nome }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [disciplinas])

  const departamentoFilterOptions = useMemo(() => {
    if (!departamentos) return []
    return departamentos.map((d) => ({
      value: d.id.toString(),
      label: d.nome,
    }))
  }, [departamentos])

  const columns: ColumnDef<DisciplinaListItem>[] = useMemo(
    () => [
      {
        id: "codigo",
        accessorKey: "codigo",
        header: createFilterableHeader<DisciplinaListItem>({
          title: "Código",
          filterType: "text",
          filterPlaceholder: "Buscar código...",
          autocompleteOptions: codigoFilterOptions,
        }),
        filterFn: codigoFilterFn,
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.codigo}</span>,
      },
      {
        id: "nome",
        accessorKey: "nome",
        header: createFilterableHeader<DisciplinaListItem>({
          title: "Nome",
          filterType: "text",
          filterPlaceholder: "Buscar nome...",
          wide: true,
          autocompleteOptions: nomeFilterOptions,
        }),
        filterFn: nomeFilterFn,
        cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
      },
      {
        id: "departamentoId",
        accessorKey: "departamentoId",
        header: createFilterableHeader<DisciplinaListItem>({
          title: "Departamento",
          filterType: "multiselect",
          filterOptions: departamentoFilterOptions,
        }),
        filterFn: departamentoFilterFn,
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
    ],
    [departamentos, codigoFilterOptions, nomeFilterOptions, departamentoFilterOptions]
  )

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
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
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
