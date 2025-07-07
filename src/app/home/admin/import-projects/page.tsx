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
import { importFormSchema, ImportHistoryItem } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, CheckCircle, Eye, FileSpreadsheet, Trash2, Upload, XCircle } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

type ImportFormData = z.infer<typeof importFormSchema>

export default function ImportProjectsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null)

  const { data: importHistory, isLoading, refetch } = api.importProjects.getImportHistory.useQuery()
  const { data: importDetails } = api.importProjects.getImportDetails.useQuery(
    { id: selectedImportId! },
    { enabled: !!selectedImportId }
  )

  const uploadFileMutation = api.file.uploadFile.useMutation()
  const importProjectsMutation = api.importProjects.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso! Processamento iniciado.")
      setIsDialogOpen(false)
      setSelectedFile(null)
      refetch()
      form.reset()
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`)
    },
  })

  const deleteImportMutation = api.importProjects.deleteImport.useMutation({
    onSuccess: () => {
      toast.success("Importação excluída com sucesso!")
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`)
    },
  })

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      ano: new Date().getFullYear(),
      semestre: "SEMESTRE_1",
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImport = async (data: ImportFormData) => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo")
      return
    }

    try {
      // Convert File to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          // Remove data:mime/type;base64, prefix
          resolve(base64.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: selectedFile.name,
        fileData,
        mimeType: selectedFile.type,
        entityType: "imports",
        entityId: `${data.ano}-${data.semestre}`,
      })

      await importProjectsMutation.mutateAsync({
        fileId: uploadResult.fileId,
        fileName: selectedFile.name,
        ano: data.ano,
        semestre: data.semestre,
      })
    } catch (error) {
      console.error("Error during import:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSANDO":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Processando
          </Badge>
        )
      case "CONCLUIDO":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        )
      case "CONCLUIDO_COM_ERROS":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Concluído com Erros
          </Badge>
        )
      case "ERRO":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<ImportHistoryItem>[] = [
    {
      header: "Arquivo",
      accessorKey: "nomeArquivo",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nomeArquivo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.ano}/{row.original.semestre === "SEMESTRE_1" ? "1" : "2"}
          </div>
        </div>
      ),
    },
    {
      header: "Projetos",
      accessorKey: "totalProjetos",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.totalProjetos}</div>
          <div className="text-xs text-muted-foreground">
            ✓ {row.original.projetosCriados} | ✗ {row.original.projetosComErro}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: "Importado por",
      accessorKey: "importadoPor.username",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.importadoPor.username}</div>
          <div className="text-sm text-muted-foreground">{row.original.importadoPor.email}</div>
        </div>
      ),
    },
    {
      header: "Data",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("pt-BR"),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedImportId(row.original.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteImportMutation.mutate({ id: row.original.id })}
            disabled={deleteImportMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PagesLayout title="Importar Planejamento" subtitle="Importe projetos de monitoria a partir de planilhas Excel">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Nova Importação
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Planilha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Importar Planejamento</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleImport)} className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="semestre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semestre</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Arquivo Excel</label>
                        <Input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} required />
                        {selectedFile && (
                          <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={importProjectsMutation.isPending || !selectedFile}
                      >
                        {importProjectsMutation.isPending ? "Importando..." : "Importar"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Importação de Projetos</h3>
              <p className="text-muted-foreground mb-4">
                Faça upload de uma planilha Excel com os dados dos projetos para importação automática.
              </p>
              <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Histórico de Importações
              {importHistory && (
                <Badge variant="outline" className="ml-2">
                  {importHistory.length} importação(ões)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando histórico...</p>
                </div>
              </div>
            ) : importHistory && importHistory.length > 0 ? (
              <TableComponent
                columns={columns}
                data={importHistory}
                searchableColumn="nomeArquivo"
                searchPlaceholder="Buscar por nome do arquivo..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma importação encontrada</h3>
                <p>Ainda não foram realizadas importações de projetos.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Details Dialog */}
        {importDetails && (
          <Dialog open={!!selectedImportId} onOpenChange={() => setSelectedImportId(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Importação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Arquivo</p>
                    <p className="text-sm text-muted-foreground">{importDetails.nomeArquivo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Período</p>
                    <p className="text-sm text-muted-foreground">
                      {importDetails.ano}/{importDetails.semestre === "SEMESTRE_1" ? "1" : "2"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total de Projetos</p>
                    <p className="text-sm text-muted-foreground">{importDetails.totalProjetos}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    {getStatusBadge(importDetails.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-600">Projetos Criados</p>
                    <p className="text-lg font-semibold text-green-600">{importDetails.projetosCriados}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Projetos com Erro</p>
                    <p className="text-lg font-semibold text-red-600">{importDetails.projetosComErro}</p>
                  </div>
                </div>

                {importDetails.erros && importDetails.erros.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Erros Encontrados</p>
                    <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                      {importDetails.erros.map((erro: string, index: number) => (
                        <p key={index} className="text-sm text-red-700 mb-1">
                          • {erro}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PagesLayout>
  )
}
