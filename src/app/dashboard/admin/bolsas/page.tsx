"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/utils/api"

type Vaga = {
  id: number
  tipo: "BOLSISTA" | "VOLUNTARIO"
  dataInicio: Date | null
  dataFim: Date | null
  aluno: {
    id: number
    nomeCompleto: string
    matricula: string
    user: {
      id: number
      username: string
      email: string
    }
  }
  projeto: {
    id: number
    titulo: string
  }
  inscricao: {
    id: number
    status:
      | "SUBMITTED"
      | "SELECTED_BOLSISTA"
      | "SELECTED_VOLUNTARIO"
      | "ACCEPTED_BOLSISTA"
      | "ACCEPTED_VOLUNTARIO"
      | "REJECTED_BY_PROFESSOR"
      | "REJECTED_BY_STUDENT"
  }
  createdAt: Date
}

export default function BolsasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    alunoId: 0,
    projetoId: 0,
    inscricaoId: 0,
    tipo: "BOLSISTA" as "BOLSISTA" | "VOLUNTARIO",
    dataInicio: "",
    dataFim: "",
  })

  const { data: vagas = [], refetch } = api.vaga.list.useQuery()
  const { data: projetos = [] } = api.projeto.list.useQuery({})

  const createVagaMutation = api.vaga.create.useMutation({
    onSuccess: () => {
      toast.success("Vaga criada com sucesso!")
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao criar vaga: ${error.message}`)
    },
  })

  const deleteVagaMutation = api.vaga.delete.useMutation({
    onSuccess: () => {
      toast.success("Vaga excluída com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao excluir vaga: ${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      alunoId: 0,
      projetoId: 0,
      inscricaoId: 0,
      tipo: "BOLSISTA",
      dataInicio: "",
      dataFim: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.alunoId || !formData.projetoId || !formData.inscricaoId) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    createVagaMutation.mutate({
      alunoId: formData.alunoId,
      projetoId: formData.projetoId,
      inscricaoId: formData.inscricaoId,
      tipo: formData.tipo,
      ...(formData.dataInicio && { dataInicio: new Date(formData.dataInicio) }),
      ...(formData.dataFim && { dataFim: new Date(formData.dataFim) }),
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED_BOLSISTA":
      case "ACCEPTED_VOLUNTARIO":
        return "bg-green-100 text-green-800"
      case "SELECTED_BOLSISTA":
      case "SELECTED_VOLUNTARIO":
        return "bg-blue-100 text-blue-800"
      case "REJECTED_BY_PROFESSOR":
      case "REJECTED_BY_STUDENT":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Submetida"
      case "SELECTED_BOLSISTA":
        return "Selecionado Bolsista"
      case "SELECTED_VOLUNTARIO":
        return "Selecionado Voluntário"
      case "ACCEPTED_BOLSISTA":
        return "Aceito Bolsista"
      case "ACCEPTED_VOLUNTARIO":
        return "Aceito Voluntário"
      case "REJECTED_BY_PROFESSOR":
        return "Rejeitado Professor"
      case "REJECTED_BY_STUDENT":
        return "Rejeitado Aluno"
      default:
        return status
    }
  }

  const columns = [
    {
      accessorKey: "aluno.nomeCompleto",
      header: "Aluno",
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium">{row.original.aluno.nomeCompleto}</p>
          <p className="text-sm text-muted-foreground">{row.original.aluno.matricula}</p>
        </div>
      ),
    },
    {
      accessorKey: "projeto.titulo",
      header: "Projeto",
      cell: ({ row }: { row: any }) => <p className="max-w-[300px] truncate">{row.original.projeto.titulo}</p>,
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }: { row: any }) => (
        <div
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            row.original.tipo === "BOLSISTA" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
          }`}
        >
          {row.original.tipo}
        </div>
      ),
    },
    {
      accessorKey: "inscricao.status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(row.original.inscricao.status)}`}>
          {getStatusLabel(row.original.inscricao.status)}
        </div>
      ),
    },
    {
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }: { row: any }) => (
        <div>
          {row.original.dataInicio && (
            <p className="text-sm">
              {new Date(row.original.dataInicio).toLocaleDateString("pt-BR")}
              {row.original.dataFim && <span> - {new Date(row.original.dataFim).toLocaleDateString("pt-BR")}</span>}
            </p>
          )}
          {!row.original.dataInicio && <p className="text-sm text-muted-foreground">Não definido</p>}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }: { row: any }) => (
        <p className="text-sm">{new Date(row.original.createdAt).toLocaleDateString("pt-BR")}</p>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: any }) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteVagaMutation.mutate({ id: row.original.id })}
          disabled={deleteVagaMutation.isPending}
        >
          Excluir
        </Button>
      ),
    },
  ]

  return (
    <PagesLayout title="Gestão de Bolsas e Vagas" subtitle="Gerencie bolsas e vagas de monitoria do sistema">
      <div className="flex items-center justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Vaga</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projetoId">Projeto *</Label>
                <select
                  id="projetoId"
                  value={formData.projetoId}
                  onChange={(e) => setFormData({ ...formData, projetoId: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  required
                >
                  <option value={0}>Selecione um projeto</option>
                  {projetos.map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricaoId">ID da Inscrição *</Label>
                <Input
                  id="inscricaoId"
                  type="number"
                  value={formData.inscricaoId || ""}
                  onChange={(e) => {
                    const inscricaoId = parseInt(e.target.value) || 0
                    setFormData({
                      ...formData,
                      inscricaoId,
                    })
                  }}
                  placeholder="Digite o ID da inscrição"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Vaga *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as "BOLSISTA" | "VOLUNTARIO" })}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  required
                >
                  <option value="BOLSISTA">Bolsista</option>
                  <option value="VOLUNTARIO">Voluntário</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createVagaMutation.isPending}>
                  {createVagaMutation.isPending ? "Criando..." : "Criar Vaga"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={vagas} />
    </PagesLayout>
  )
}
