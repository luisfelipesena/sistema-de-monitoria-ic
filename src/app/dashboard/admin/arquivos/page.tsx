"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Loader2, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type FileItem = {
  fileId: string
  fileName: string
  category: string
  uploadedAt: Date
  size?: number
}

export default function AdminFilesPage() {
  const utils = api.useUtils()
  const { data: files, isLoading } = api.files.listUserFiles.useQuery({
    userId: 1,
  })

  const deleteFileMutation = api.files.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("Arquivo excluído com sucesso!")
      utils.files.listUserFiles.invalidate()
    },
    onError: (error) => {
      toast.error("Erro ao excluir arquivo", {
        description: error.message,
      })
    },
  })

  const getUploadUrlMutation = api.files.getUploadUrl.useMutation({
    onSuccess: (data) => {
      setUploadUrl(data.uploadUrl)
      setFileId(data.fileId)
      toast.success("URL de upload gerada!")
    },
    onError: (error) => {
      toast.error("Erro ao gerar URL de upload", {
        description: error.message,
      })
    },
  })

  const getDownloadUrlMutation = api.files.getDownloadUrl.useMutation({
    onSuccess: (data) => {
      window.open(data.downloadUrl, "_blank")
    },
    onError: (error: any) => {
      toast.error("Erro ao obter URL de download", {
        description: error.message,
      })
    },
  })

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [entityType, setEntityType] = useState<string>("admin-uploads")
  const [entityId, setEntityId] = useState<string>("general")
  const [uploadUrl, setUploadUrl] = useState<string>("")
  const [fileId, setFileId] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const entityTypeOptions = [
    { value: "admin-uploads", label: "Uploads Administrativos" },
    { value: "editais", label: "Editais" },
    { value: "contratos", label: "Contratos" },
    { value: "atas", label: "Atas de Reunião" },
    { value: "historico_escolar", label: "Histórico Escolar" },
    { value: "comprovante_matricula", label: "Comprovantes de Matrícula" },
  ]

  const handleViewFile = (file: FileItem) => {
    getDownloadUrlMutation.mutate({
      fileId: file.fileId,
      userId: 1,
    })
  }

  const handleDeleteFile = (file: FileItem) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo ${file.fileName}?`)) {
      deleteFileMutation.mutate({
        fileId: file.fileId,
        userId: 1,
      })
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo primeiro")
      return
    }

    setIsUploading(true)
    try {
      await getUploadUrlMutation.mutateAsync({
        fileName: uploadFile.name,
        fileType: uploadFile.type,
        category: entityType as "projeto" | "inscricao" | "usuario" | "edital",
        userId: 1,
      })

      if (uploadUrl) {
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: uploadFile,
          headers: {
            "Content-Type": uploadFile.type,
          },
        })

        if (uploadResponse.ok) {
          toast.success("Arquivo enviado com sucesso!")
          utils.files.listUserFiles.invalidate()
          setUploadFile(null)
          setUploadUrl("")
          setFileId("")
        } else {
          throw new Error("Falha no upload")
        }
      }
    } catch (error) {
      toast.error("Erro no upload do arquivo")
    } finally {
      setIsUploading(false)
    }
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: "fileName",
      header: "Nome do Arquivo",
      cell: ({ row }) => (
        <div className="font-medium truncate max-w-xs" title={row.original.fileName}>
          {row.original.fileName}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => (
        <div className="capitalize">
          {entityTypeOptions.find((opt) => opt.value === row.original.category)?.label || row.original.category}
        </div>
      ),
    },
    {
      accessorKey: "size",
      header: "Tamanho",
      cell: ({ row }) => (row.original.size ? formatBytes(row.original.size) : "-"),
    },
    {
      accessorKey: "uploadedAt",
      header: "Data de Upload",
      cell: ({ row }) => format(new Date(row.original.uploadedAt), "dd/MM/yyyy HH:mm"),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleViewFile(file)} title="Visualizar/Baixar">
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteFile(file)}
              disabled={deleteFileMutation.isPending}
              title="Excluir"
            >
              {deleteFileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout title="Gerenciamento de Arquivos">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Arquivos no Sistema</CardTitle>
            <CardDescription>Gerencie todos os arquivos carregados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Carregando arquivos...</span>
              </div>
            ) : files && files.length > 0 ? (
              <DataTable columns={columns} data={files} />
            ) : (
              <p className="py-4 text-center text-muted-foreground">Nenhum arquivo encontrado no sistema.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Faça upload de arquivos para o sistema. Selecione a categoria e o identificador para organizar os
              arquivos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entityType">Categoria</Label>
                  <Select value={entityType} onValueChange={(value) => setEntityType(value)}>
                    <SelectTrigger id="entityType">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityId">Identificador</Label>
                  <Input
                    id="entityId"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="Ex: usuario-123"
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador opcional para organizar arquivos na categoria
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Selecionar Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {uploadFile && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {uploadFile.name} ({formatBytes(uploadFile.size)})
                  </p>
                )}
              </div>

              <Button disabled={!uploadFile || isUploading} className="w-full" onClick={handleUpload}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? "Enviando..." : "Enviar Arquivo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}
