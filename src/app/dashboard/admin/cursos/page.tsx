"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { GraduationCap, Loader, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type CursoWithDepartamento = {
  id: number
  nome: string
  codigo: number
  cargaHoraria: number
  descricao: string | null
  departamento: {
    id: number
    nome: string
    sigla: string | null
  }
  createdAt: Date
}

interface CursoFormData {
  nome: string
  codigo: number
  departamentoId: number
  cargaHoraria: number
  descricao?: string
}

export default function CursosPage() {
  const utils = api.useUtils()
  const { data: departamentos } = api.departamento.list.useQuery()
  const { data: cursos, isLoading: loadingCursos } = api.curso.list.useQuery({})

  const createCursoMutation = api.curso.create.useMutation({
    onSuccess: () => {
      toast.success("Curso criado com sucesso!")
      utils.curso.list.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao criar curso", {
        description: error.message,
      })
    },
  })

  const updateCursoMutation = api.curso.update.useMutation({
    onSuccess: () => {
      toast.success("Curso atualizado com sucesso!")
      utils.curso.list.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao atualizar curso", {
        description: error.message,
      })
    },
  })

  const deleteCursoMutation = api.curso.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso excluído com sucesso!")
      utils.curso.list.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao excluir curso", {
        description: error.message,
      })
    },
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCursoId, setEditingCursoId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<CursoFormData>>({})

  const handleSaveCurso = async () => {
    if (!formData.nome || !formData.codigo || !formData.departamentoId || !formData.cargaHoraria) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const mutationData = {
      nome: formData.nome,
      codigo: formData.codigo,
      departamentoId: formData.departamentoId,
      cargaHoraria: formData.cargaHoraria,
      descricao: formData.descricao,
    }

    try {
      if (isEditMode && editingCursoId) {
        await updateCursoMutation.mutateAsync({
          id: editingCursoId,
          ...mutationData,
        })
      } else {
        await createCursoMutation.mutateAsync(mutationData)
      }

      setIsModalOpen(false)
      setFormData({})
      setIsEditMode(false)
      setEditingCursoId(null)
    } catch (error) {
      // Errors are handled by the mutation's onError callback
    }
  }

  const handleEditCurso = (curso: CursoWithDepartamento) => {
    setIsEditMode(true)
    setEditingCursoId(curso.id)
    setFormData({
      nome: curso.nome,
      codigo: curso.codigo,
      departamentoId: curso.departamento.id,
      cargaHoraria: curso.cargaHoraria,
      descricao: curso.descricao ?? undefined,
    })
    setIsModalOpen(true)
  }

  const handleDeleteCurso = async (cursoId: number) => {
    if (confirm("Tem certeza que deseja excluir este curso?")) {
      await deleteCursoMutation.mutateAsync({ id: cursoId })
    }
  }

  const columns: ColumnDef<CursoWithDepartamento>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-400" />
          Nome
        </div>
      ),
      accessorKey: "nome",
      cell: ({ row }) => <span className="font-semibold text-base text-gray-900">{row.original.nome}</span>,
    },
    {
      header: "Código",
      accessorKey: "codigo",
    },
    {
      header: "Departamento",
      accessorKey: "departamento.nome",
    },
    {
      header: "Ações",
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditCurso(row.original)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeleteCurso(row.original.id)}
            disabled={deleteCursoMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  const actions = (
    <Button
      variant="primary"
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      onClick={() => {
        setIsEditMode(false)
        setEditingCursoId(null)
        setFormData({})
        setIsModalOpen(true)
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Curso
    </Button>
  )

  return (
    <PagesLayout title="Gerenciar Cursos" actions={actions}>
      {loadingCursos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando cursos...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={cursos || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Curso" : "Adicionar Curso"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Curso *</Label>
              <Input
                value={formData.nome || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Ciência da Computação"
              />
            </div>
            <div>
              <Label>Código do Curso *</Label>
              <Input
                type="number"
                value={formData.codigo || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codigo: Number(e.target.value),
                  }))
                }
                placeholder="Ex: 112140"
              />
            </div>
            <div>
              <Label>Departamento *</Label>
              <Select
                value={formData.departamentoId?.toString() || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, departamentoId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos?.map((depto) => (
                    <SelectItem key={depto.id} value={depto.id.toString()}>
                      {depto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Carga Horária *</Label>
              <Input
                type="number"
                value={formData.cargaHoraria || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cargaHoraria: Number(e.target.value),
                  }))
                }
                placeholder="Ex: 68"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do curso (opcional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCurso} disabled={createCursoMutation.isPending || updateCursoMutation.isPending}>
              {createCursoMutation.isPending || updateCursoMutation.isPending ? (
                <Loader className="animate-spin" />
              ) : isEditMode ? (
                "Atualizar Curso"
              ) : (
                "Criar Curso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
