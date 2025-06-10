"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/utils/api"
import { FileText, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Edital = {
  id: number
  titulo: string
  numeroEdital: string
  descricaoHtml: string | null
  publicado: boolean
  dataPublicacao: Date | null
  periodo: {
    id: number
    semestre: "SEMESTRE_1" | "SEMESTRE_2"
    ano: number
    dataInicio: Date
    dataFim: Date
  }
  criadoPor: {
    id: number
    username: string
  }
  createdAt: Date
}

export default function EditaisPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    numeroEdital: "",
    descricaoHtml: "",
    periodoInscricaoId: 0,
  })

  const { data: editais = [], refetch } = api.edital.list.useQuery()
  const { data: periodos = [] } = api.periodoInscricao.list.useQuery({})

  const createEditalMutation = api.edital.create.useMutation({
    onSuccess: () => {
      toast.success("Edital criado com sucesso!")
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao criar edital: ${error.message}`)
    },
  })

  const deleteEditalMutation = api.edital.delete.useMutation({
    onSuccess: () => {
      toast.success("Edital excluído com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao excluir edital: ${error.message}`)
    },
  })

  const updateEditalMutation = api.edital.update.useMutation({
    onSuccess: () => {
      toast.success("Status do edital atualizado!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar edital: ${error.message}`)
    },
  })

  const resetForm = () => {
    setFormData({
      titulo: "",
      numeroEdital: "",
      descricaoHtml: "",
      periodoInscricaoId: 0,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim() || !formData.numeroEdital.trim()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    createEditalMutation.mutate({
      ...formData,
      criadoPorUserId: 1, // Mock user ID
    })
  }

  const togglePublicacao = (edital: Edital) => {
    const updateData = {
      id: edital.id,
      publicado: !edital.publicado,
      ...(edital.publicado ? {} : { dataPublicacao: new Date() }),
    }

    updateEditalMutation.mutate(updateData)
  }

  const columns = [
    {
      accessorKey: "titulo",
      header: "Título",
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium">{row.original.titulo}</p>
          <p className="text-sm text-muted-foreground">{row.original.numeroEdital}</p>
        </div>
      ),
    },
    {
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium">{row.original.periodo.ano}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.periodo.semestre === "SEMESTRE_1" ? "1º Semestre" : "2º Semestre"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "publicado",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <div
          className={`inline-flex px-2 py-1 rounded-full text-xs ${
            row.original.publicado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.original.publicado ? "Publicado" : "Rascunho"}
        </div>
      ),
    },
    {
      accessorKey: "dataPublicacao",
      header: "Data Publicação",
      cell: ({ row }: { row: any }) => (
        <p>{row.original.dataPublicacao ? new Date(row.original.dataPublicacao).toLocaleDateString("pt-BR") : "-"}</p>
      ),
    },
    {
      accessorKey: "criadoPor.username",
      header: "Criado por",
      cell: ({ row }: { row: any }) => <p className="text-sm">{row.original.criadoPor.username}</p>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: any }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePublicacao(row.original)}
            disabled={updateEditalMutation.isPending}
          >
            {row.original.publicado ? "Despublicar" : "Publicar"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteEditalMutation.mutate({ id: row.original.id })}
            disabled={deleteEditalMutation.isPending}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PagesLayout
      title="Editais de Monitoria"
      subtitle="Gerencie editais de seleção para vagas de monitoria"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Edital
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Edital</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Edital Interno de Seleção de Monitores 2024.1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroEdital">Número do Edital *</Label>
                <Input
                  id="numeroEdital"
                  value={formData.numeroEdital}
                  onChange={(e) => setFormData({ ...formData, numeroEdital: e.target.value })}
                  placeholder="Ex: 001/2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodoInscricaoId">Período de Inscrição *</Label>
                <select
                  id="periodoInscricaoId"
                  value={formData.periodoInscricaoId}
                  onChange={(e) => setFormData({ ...formData, periodoInscricaoId: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                  required
                >
                  <option value={0}>Selecione um período</option>
                  {periodos.map((periodo) => (
                    <option key={periodo.id} value={periodo.id}>
                      {periodo.ano} - {periodo.semestre === "SEMESTRE_1" ? "1º Semestre" : "2º Semestre"} (
                      {new Date(periodo.dataInicio).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(periodo.dataFim).toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricaoHtml">Descrição/Conteúdo</Label>
                <Textarea
                  id="descricaoHtml"
                  value={formData.descricaoHtml}
                  onChange={(e) => setFormData({ ...formData, descricaoHtml: e.target.value })}
                  placeholder="Conteúdo do edital em HTML..."
                  className="min-h-[100px]"
                />
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
                <Button type="submit" disabled={createEditalMutation.isPending}>
                  {createEditalMutation.isPending ? "Criando..." : "Criar Edital"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editais Cadastrados
          </CardTitle>
          <CardDescription>Gerencie editais de seleção para monitoria acadêmica</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={editais} />
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
