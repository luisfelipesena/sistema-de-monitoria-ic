"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/utils/api"
import { ArrowLeftRight, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function EquivalenciasPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEquivalenceId, setSelectedEquivalenceId] = useState<number | null>(null)
  const [disciplinaOrigemId, setDisciplinaOrigemId] = useState<string>("")
  const [disciplinaEquivalenteId, setDisciplinaEquivalenteId] = useState<string>("")

  const { data: equivalences, isLoading: isLoadingEquivalences, refetch } = api.discipline.listEquivalences.useQuery()
  const { data: disciplines, isLoading: isLoadingDisciplines } = api.discipline.getDisciplines.useQuery()

  const createMutation = api.discipline.createEquivalence.useMutation({
    onSuccess: () => {
      toast.success("Equivalência criada com sucesso")
      setIsCreateDialogOpen(false)
      setDisciplinaOrigemId("")
      setDisciplinaEquivalenteId("")
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar equivalência")
    },
  })

  const deleteMutation = api.discipline.deleteEquivalence.useMutation({
    onSuccess: () => {
      toast.success("Equivalência removida com sucesso")
      setIsDeleteDialogOpen(false)
      setSelectedEquivalenceId(null)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover equivalência")
    },
  })

  const handleCreate = () => {
    if (!disciplinaOrigemId || !disciplinaEquivalenteId) {
      toast.error("Selecione ambas as disciplinas")
      return
    }

    if (disciplinaOrigemId === disciplinaEquivalenteId) {
      toast.error("Uma disciplina não pode ser equivalente a ela mesma")
      return
    }

    createMutation.mutate({
      disciplinaOrigemId: parseInt(disciplinaOrigemId),
      disciplinaEquivalenteId: parseInt(disciplinaEquivalenteId),
    })
  }

  const handleDelete = () => {
    if (!selectedEquivalenceId) return
    deleteMutation.mutate({ id: selectedEquivalenceId })
  }

  const openDeleteDialog = (id: number) => {
    setSelectedEquivalenceId(id)
    setIsDeleteDialogOpen(true)
  }

  if (isLoadingEquivalences || isLoadingDisciplines) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equivalências de Disciplinas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as equivalências entre disciplinas do departamento
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Equivalência
        </Button>
      </div>

      {equivalences && equivalences.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">Nenhuma equivalência cadastrada</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira equivalência
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina A</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Disciplina B</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equivalences?.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{eq.disciplinaOrigem.codigo}</div>
                      <div className="text-sm text-muted-foreground">{eq.disciplinaOrigem.nome}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{eq.disciplinaEquivalente.codigo}</div>
                      <div className="text-sm text-muted-foreground">{eq.disciplinaEquivalente.nome}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(eq.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Equivalência</DialogTitle>
            <DialogDescription>
              Defina que duas disciplinas são equivalentes entre si
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina A</label>
              <Select value={disciplinaOrigemId} onValueChange={setDisciplinaOrigemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines?.map((disc) => (
                    <SelectItem key={disc.id} value={disc.id.toString()}>
                      {disc.codigo} - {disc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina B</label>
              <Select value={disciplinaEquivalenteId} onValueChange={setDisciplinaEquivalenteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines
                    ?.filter((disc) => disc.id.toString() !== disciplinaOrigemId)
                    ?.map((disc) => (
                      <SelectItem key={disc.id} value={disc.id.toString()}>
                        {disc.codigo} - {disc.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Equivalência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Equivalência</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta equivalência? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
