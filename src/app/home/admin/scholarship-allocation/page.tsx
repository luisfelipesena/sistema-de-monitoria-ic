"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { ColumnDef } from "@tanstack/react-table"
import { Award, Edit, Eye, Save, TrendingUp, Users } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const filterFormSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]),
})

type FilterFormData = z.infer<typeof filterFormSchema>

export default function ScholarshipAllocationPage() {
  const { toast } = useToast()

  const [filters, setFilters] = useState<FilterFormData>({
    ano: new Date().getFullYear(),
    semestre: "SEMESTRE_1",
  })
  const [editingAllocations, setEditingAllocations] = useState<Record<number, number>>({})
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [totalProgradInput, setTotalProgradInput] = useState<string>("")
  const [showProgradDialog, setShowProgradDialog] = useState(false)

  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filters,
  })

  const { data: projects, isLoading, refetch } = api.scholarshipAllocation.getApprovedProjects.useQuery(filters)
  const { data: summary } = api.scholarshipAllocation.getAllocationSummary.useQuery(filters)
  const { data: candidates } = api.scholarshipAllocation.getCandidatesForProject.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )
  const { data: progradData, refetch: refetchProgradTotal } =
    api.scholarshipAllocation.getTotalProgradScholarships.useQuery(filters)

  const updateAllocationMutation = api.scholarshipAllocation.updateScholarshipAllocation.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Alocação atualizada!",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const bulkUpdateMutation = api.scholarshipAllocation.bulkUpdateAllocations.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Alocações atualizadas!",
      })
      setEditingAllocations({})
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const allocateCandidateMutation = api.scholarshipAllocation.allocateScholarshipToCandidate.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Candidato selecionado!",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const setProgradTotalMutation = api.scholarshipAllocation.setTotalScholarshipsFromPrograd.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: `Total de ${data.totalBolsas} bolsas PROGRAD definido.`,
      })
      setShowProgradDialog(false)
      setTotalProgradInput("")
      refetchProgradTotal()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível definir o total de bolsas.",
        variant: "destructive",
      })
    },
  })

  const notifyProfessorsMutation = api.scholarshipAllocation.notifyProfessorsAfterAllocation.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Emails Enviados!",
        description: `${data.emailsEnviados} professores notificados sobre alocação de bolsas.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar notificações.",
        variant: "destructive",
      })
    },
  })

  const handleFilterSubmit = (data: FilterFormData) => {
    setFilters(data)
  }

  const handleSetProgradTotal = () => {
    const total = parseInt(totalProgradInput)
    if (isNaN(total) || total < 0) {
      toast({
        title: "Valor Inválido",
        description: "Digite um número válido de bolsas.",
        variant: "destructive",
      })
      return
    }
    setProgradTotalMutation.mutate({
      ano: filters.ano,
      semestre: filters.semestre,
      totalBolsas: total,
    })
  }

  const handleNotifyProfessors = () => {
    notifyProfessorsMutation.mutate({
      ano: filters.ano,
      semestre: filters.semestre,
    })
  }

  const handleEditAllocation = (projectId: number, currentValue: number) => {
    setEditingAllocations((prev) => ({
      ...prev,
      [projectId]: currentValue,
    }))
  }

  const handleSaveAllocation = (projectId: number) => {
    const newValue = editingAllocations[projectId]
    if (newValue !== undefined) {
      updateAllocationMutation.mutate({
        projetoId: projectId,
        bolsasDisponibilizadas: newValue,
      })
      setEditingAllocations((prev) => {
        const updated = { ...prev }
        delete updated[projectId]
        return updated
      })
    }
  }

  const handleBulkSave = () => {
    const allocations = Object.entries(editingAllocations).map(([projetoId, bolsasDisponibilizadas]) => ({
      projetoId: parseInt(projetoId),
      bolsasDisponibilizadas,
    }))

    bulkUpdateMutation.mutate({ allocations })
  }

  const getAllocationStatus = (project: NonNullable<typeof projects>[number]) => {
    const disponibilizadas = project.bolsasDisponibilizadas || 0
    const solicitadas = project.bolsasSolicitadas

    if (disponibilizadas === 0) return "Não Alocado"
    if (disponibilizadas < solicitadas) return "Parcialmente Alocado"
    if (disponibilizadas === solicitadas) return "Totalmente Alocado"
    return "Sobre-alocado"
  }

  const getStatusBadge = (project: NonNullable<typeof projects>[number]) => {
    const status = getAllocationStatus(project)

    switch (status) {
      case "Não Alocado":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700">
            Não Alocado
          </Badge>
        )
      case "Parcialmente Alocado":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            Parcial
          </Badge>
        )
      case "Totalmente Alocado":
        return (
          <Badge variant="default" className="bg-green-500">
            Completo
          </Badge>
        )
      case "Sobre-alocado":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            Sobre-alocado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<NonNullable<typeof projects>[number], unknown>[] = [
    {
      header: "Projeto",
      accessorKey: "titulo",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.disciplinas.map((d) => d.codigo).join(", ")}
          </div>
        </div>
      ),
    },
    {
      header: "Professor",
      accessorKey: "professorResponsavel.nomeCompleto",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professorResponsavel.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento.sigla}</div>
        </div>
      ),
    },
    {
      header: "Solicitadas",
      accessorKey: "bolsasSolicitadas",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.bolsasSolicitadas}</div>
          <div className="text-xs text-muted-foreground">bolsas</div>
        </div>
      ),
    },
    {
      header: "Disponibilizadas",
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => {
        const projectId = row.original.id
        const isEditing = editingAllocations.hasOwnProperty(projectId)
        const currentValue = row.original.bolsasDisponibilizadas || 0

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                className="w-20"
                value={editingAllocations[projectId]}
                onChange={(e) =>
                  setEditingAllocations((prev) => ({
                    ...prev,
                    [projectId]: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveAllocation(projectId)}
                disabled={updateAllocationMutation.isPending}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{currentValue}</span>
            <Button variant="outline" size="sm" onClick={() => handleEditAllocation(projectId, currentValue)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedProjectId(row.original.id)}>
          <Eye className="h-4 w-4 mr-1" />
          Candidatos
        </Button>
      ),
    },
  ]

  const candidateColumns: ColumnDef<NonNullable<typeof candidates>[number], unknown>[] = [
    {
      header: "Aluno",
      id: "aluno",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">Mat: {row.original.aluno.matricula}</div>
        </div>
      ),
    },
    {
      header: "CR",
      id: "cr",
      cell: ({ row }) => row.original.aluno.cr?.toFixed(2) || "-",
    },
    {
      header: "Nota Final",
      id: "notaFinal",
      cell: ({ row }) => row.original.notaFinal || "-",
    },
    {
      header: "Tipo Pretendido",
      id: "tipoVaga",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.tipoVagaPretendida === "BOLSISTA" ? "Bolsista" : "Voluntário"}</Badge>
      ),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              allocateCandidateMutation.mutate({
                inscricaoId: row.original.id,
                tipo: "BOLSISTA",
              })
            }
            disabled={allocateCandidateMutation.isPending}
          >
            Bolsista
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              allocateCandidateMutation.mutate({
                inscricaoId: row.original.id,
                tipo: "VOLUNTARIO",
              })
            }
            disabled={allocateCandidateMutation.isPending}
          >
            Voluntário
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PagesLayout title="Alocação de Bolsas" subtitle="Gerencie a distribuição de bolsas para projetos aprovados">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFilterSubmit)} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="w-32"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semestre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                          <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Filtrar</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestão de Bolsas PROGRAD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total PROGRAD</p>
                  <p className="text-3xl font-bold text-blue-600">{progradData?.totalBolsasPrograd || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">bolsas disponibilizadas</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Alocadas</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {summary?.summary.totalBolsasDisponibilizadas || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">nos projetos</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Restantes</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(progradData?.totalBolsasPrograd || 0) -
                      (Number(summary?.summary.totalBolsasDisponibilizadas) || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">disponíveis</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setShowProgradDialog(true)} variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  Definir Total PROGRAD
                </Button>
                <Button
                  onClick={handleNotifyProfessors}
                  disabled={
                    notifyProfessorsMutation.isPending ||
                    (Number(summary?.summary.totalBolsasDisponibilizadas) || 0) === 0
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Notificar Professores
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Projetos</p>
                    <p className="text-2xl font-semibold">{summary.summary.totalProjetos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bolsas Solicitadas</p>
                    <p className="text-2xl font-semibold">{summary.summary.totalBolsasSolicitadas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bolsas Disponibilizadas</p>
                    <p className="text-2xl font-semibold">{summary.summary.totalBolsasDisponibilizadas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Atendimento</p>
                    <p className="text-2xl font-semibold">
                      {summary.summary.totalBolsasSolicitadas
                        ? Math.round(
                            ((Number(summary.summary.totalBolsasDisponibilizadas) || 0) /
                              Number(summary.summary.totalBolsasSolicitadas)) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Alocação de Bolsas
                {projects && (
                  <Badge variant="outline" className="ml-2">
                    {projects.length} projeto(s)
                  </Badge>
                )}
              </div>
              {Object.keys(editingAllocations).length > 0 && (
                <Button onClick={handleBulkSave} disabled={bulkUpdateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Todas ({Object.keys(editingAllocations).length})
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando projetos...</p>
                </div>
              </div>
            ) : projects && projects.length > 0 ? (
              <TableComponent
                columns={columns}
                data={projects}
                searchableColumn="titulo"
                searchPlaceholder="Buscar por título do projeto..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
                <p>Não há projetos aprovados para o período selecionado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProjectId && (
          <Dialog open={!!selectedProjectId} onOpenChange={() => setSelectedProjectId(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Candidatos do Projeto</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {candidates && candidates.length > 0 ? (
                  <TableComponent
                    columns={candidateColumns}
                    data={candidates}
                    searchableColumn="aluno.nomeCompleto"
                    searchPlaceholder="Buscar por nome do aluno..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-4" />
                    <p>Nenhum candidato encontrado para este projeto.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showProgradDialog} onOpenChange={setShowProgradDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Total de Bolsas PROGRAD</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total de bolsas disponibilizadas pela PROGRAD</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Digite o número de bolsas"
                  value={totalProgradInput}
                  onChange={(e) => setTotalProgradInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Este é o número total de bolsas que a PROGRAD disponibilizou para o período {filters.ano}.
                  {filters.semestre === "SEMESTRE_1" ? "1" : "2"}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Este valor define o limite máximo de bolsas que podem ser alocadas aos
                  projetos.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProgradDialog(false)
                  setTotalProgradInput("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSetProgradTotal} disabled={setProgradTotalMutation.isPending}>
                {setProgradTotalMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
