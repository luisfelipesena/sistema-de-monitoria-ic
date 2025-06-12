"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEditalPdf } from "@/hooks/use-files"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, CheckCircle, Clock, Edit, Eye, FileText, Plus, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const editalFormSchema = z
  .object({
    numeroEdital: z.string().min(1, "Número do edital é obrigatório"),
    titulo: z.string().min(1, "Título é obrigatório"),
    descricaoHtml: z.string().optional(),
    ano: z.number().min(2000).max(2050),
    semestre: z.enum(["SEMESTRE_1", "SEMESTRE_2"]),
    dataInicio: z.date(),
    dataFim: z.date(),
  })
  .refine((data) => data.dataFim > data.dataInicio, {
    message: "Data de fim deve ser posterior à data de início",
    path: ["dataFim"],
  })

type EditalFormData = z.infer<typeof editalFormSchema>

type EditalItem = {
  id: number
  numeroEdital: string
  titulo: string
  descricaoHtml: string | null
  fileIdAssinado: string | null
  dataPublicacao: Date | null
  publicado: boolean
  createdAt: Date
  periodoInscricao: {
    id: number
    semestre: "SEMESTRE_1" | "SEMESTRE_2"
    ano: number
    dataInicio: Date
    dataFim: Date
    status: "ATIVO" | "FUTURO" | "FINALIZADO"
    totalProjetos: number
    totalInscricoes: number
  } | null
  criadoPor: {
    id: number
    username: string
    email: string
  } | null
}

export default function EditalManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEdital, setSelectedEdital] = useState<EditalItem | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const { data: editais, isLoading, refetch } = api.edital.getEditais.useQuery()

  const createEditalMutation = api.edital.createEdital.useMutation({
    onSuccess: () => {
      toast.success("Edital criado com sucesso!")
      setIsCreateDialogOpen(false)
      refetch()
      createForm.reset()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const updateEditalMutation = api.edital.updateEdital.useMutation({
    onSuccess: () => {
      toast.success("Edital atualizado com sucesso!")
      setIsEditDialogOpen(false)
      setSelectedEdital(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const deleteEditalMutation = api.edital.deleteEdital.useMutation({
    onSuccess: () => {
      toast.success("Edital excluído com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const publishEditalMutation = api.edital.publishEdital.useMutation({
    onSuccess: () => {
      toast.success("Edital publicado com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const uploadSignedMutation = api.edital.uploadSignedEdital.useMutation({
    onSuccess: () => {
      toast.success("Edital assinado carregado com sucesso!")
      setUploadFile(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const uploadFileMutation = api.file.uploadFile.useMutation()
  const generatePdfMutation = useEditalPdf()

  const createForm = useForm<EditalFormData>({
    resolver: zodResolver(editalFormSchema),
    defaultValues: {
      numeroEdital: "",
      titulo: "Edital Interno de Seleção de Monitores",
      descricaoHtml: "",
      ano: new Date().getFullYear(),
      semestre: "SEMESTRE_1",
    },
  })

  const editForm = useForm<EditalFormData>({
    resolver: zodResolver(editalFormSchema),
  })

  const handleCreate = (data: EditalFormData) => {
    createEditalMutation.mutate(data)
  }

  const handleEdit = (data: EditalFormData) => {
    if (!selectedEdital) return
    updateEditalMutation.mutate({ id: selectedEdital.id, ...data })
  }

  const handleDelete = (id: number) => {
    if (
      confirm("Tem certeza que deseja excluir este edital? Esta ação excluirá também o período de inscrição associado.")
    ) {
      deleteEditalMutation.mutate({ id })
    }
  }

  const handlePublish = (id: number) => {
    publishEditalMutation.mutate({ id })
  }

  const handleUploadSigned = async (editalId: number) => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo PDF assinado")
      return
    }

    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          resolve(base64.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(uploadFile)
      })

      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: uploadFile.name,
        fileData,
        mimeType: uploadFile.type,
        entityType: "edital",
        entityId: editalId.toString(),
      })

      await uploadSignedMutation.mutateAsync({
        id: editalId,
        fileId: uploadResult.fileId,
      })
    } catch (error) {
      console.error("Error uploading signed edital:", error)
    }
  }

  const handleViewPdf = async (editalId: number) => {
    try {
      const result = await generatePdfMutation.mutateAsync({ id: editalId })
      window.open(result.url, "_blank", "noopener,noreferrer")
      toast.success("PDF do edital aberto em nova aba")
    } catch (error) {
      toast.error("Erro ao gerar PDF do edital")
      console.error("Error generating PDF:", error)
    }
  }

  const openEditDialog = (edital: EditalItem) => {
    setSelectedEdital(edital)
    editForm.reset({
      numeroEdital: edital.numeroEdital,
      titulo: edital.titulo,
      descricaoHtml: edital.descricaoHtml || "",
      ano: edital.periodoInscricao?.ano || new Date().getFullYear(),
      semestre: edital.periodoInscricao?.semestre || "SEMESTRE_1",
      dataInicio: edital.periodoInscricao?.dataInicio ? new Date(edital.periodoInscricao.dataInicio) : new Date(),
      dataFim: edital.periodoInscricao?.dataFim ? new Date(edital.periodoInscricao.dataFim) : new Date(),
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (edital: EditalItem) => {
    if (edital.publicado) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publicado
        </Badge>
      )
    }

    if (edital.fileIdAssinado) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          Assinado
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        Rascunho
      </Badge>
    )
  }

  const getPeriodStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return (
          <Badge variant="default" className="bg-green-500">
            Ativo
          </Badge>
        )
      case "FUTURO":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            Futuro
          </Badge>
        )
      case "FINALIZADO":
        return <Badge variant="outline">Finalizado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const getDurationDays = (start: Date, end: Date) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const columns: ColumnDef<EditalItem>[] = [
    {
      header: "Edital",
      accessorKey: "numeroEdital",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.numeroEdital}</div>
          <div className="text-sm text-muted-foreground truncate max-w-xs">{row.original.titulo}</div>
        </div>
      ),
    },
    {
      header: "Período de Inscrição",
      cell: ({ row }) => {
        const periodo = row.original.periodoInscricao
        if (!periodo) return "-"

        const durationDays = getDurationDays(periodo.dataInicio, periodo.dataFim)

        return (
          <div>
            <div className="font-medium">
              {periodo.ano}/{periodo.semestre === "SEMESTRE_1" ? "1" : "2"}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(periodo.dataInicio)} - {formatDate(periodo.dataFim)}
            </div>
            <div className="text-xs text-muted-foreground">{durationDays} dias de duração</div>
            <div className="text-sm mt-1">{getPeriodStatusBadge(periodo.status)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {periodo.totalProjetos} projetos • {periodo.totalInscricoes} inscrições
            </div>
          </div>
        )
      },
    },
    {
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      header: "Data de Criação",
      accessorKey: "createdAt",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      header: "Criado por",
      cell: ({ row }) => row.original.criadoPor?.username || "-",
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => {
        const edital = row.original
        const canPublish = edital.fileIdAssinado && !edital.publicado

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPdf(edital.id)}
              disabled={generatePdfMutation.isPending}
              title="Visualizar PDF"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={() => openEditDialog(edital)}>
              <Edit className="h-4 w-4" />
            </Button>

            {!edital.fileIdAssinado && (
              <div className="flex items-center gap-1">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-32 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUploadSigned(edital.id)}
                  disabled={!uploadFile || uploadSignedMutation.isPending}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            )}

            {canPublish && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePublish(edital.id)}
                disabled={publishEditalMutation.isPending}
              >
                Publicar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(edital.id)}
              disabled={deleteEditalMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout
      title="Gerenciar Editais"
      subtitle="Crie, edite e publique editais de seleção de monitores. Cada edital inclui automaticamente seu período de inscrição."
    >
      <div className="space-y-6">
        {/* Cards de estatísticas dos períodos */}
        {editais && editais.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Períodos Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {editais.filter((e) => e.periodoInscricao?.status === "ATIVO").length}
                </div>
                <p className="text-xs text-muted-foreground">Períodos abertos para inscrições</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Períodos Futuros</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {editais.filter((e) => e.periodoInscricao?.status === "FUTURO").length}
                </div>
                <p className="text-xs text-muted-foreground">Períodos agendados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Editais Publicados</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{editais.filter((e) => e.publicado).length}</div>
                <p className="text-xs text-muted-foreground">Editais disponíveis publicamente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <AlertCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {editais.reduce((sum, e) => sum + (e.periodoInscricao?.totalProjetos || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Projetos em todos os editais</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Editais e Períodos de Inscrição
                {editais && (
                  <Badge variant="outline" className="ml-2">
                    {editais.length} edital(is)
                  </Badge>
                )}
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Edital
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Edital</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="numeroEdital"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do Edital</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 001/2024" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="titulo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="ano"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="semestre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semestre</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o semestre" />
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="dataInicio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Início</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? field.value.toISOString().split("T")[0] : ""}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="dataFim"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Fim</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? field.value.toISOString().split("T")[0] : ""}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={createForm.control}
                        name="descricaoHtml"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição (HTML)</FormLabel>
                            <FormControl>
                              <Textarea rows={6} placeholder="Descrição detalhada do edital..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createEditalMutation.isPending}>
                        {createEditalMutation.isPending ? "Criando..." : "Criar Edital"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando editais...</p>
                </div>
              </div>
            ) : editais && editais.length > 0 ? (
              <TableComponent
                columns={columns}
                data={editais}
                searchableColumn="numeroEdital"
                searchPlaceholder="Buscar por número do edital..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum edital encontrado</h3>
                <p>Crie o primeiro edital para começar o processo de seleção de monitores.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Edital</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="numeroEdital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Edital</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="ano"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="semestre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semestre</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o semestre" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="dataInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="dataFim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="descricaoHtml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (HTML)</FormLabel>
                      <FormControl>
                        <Textarea rows={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateEditalMutation.isPending}>
                  {updateEditalMutation.isPending ? "Atualizando..." : "Atualizar Edital"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
