'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileUploader } from '@/components/ui/FileUploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Eye, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'

const log = logger.child({
  context: 'AdminFilesPage',
})

interface FileListItem {
  objectName: string
  originalFilename?: string
  size: number
  lastModified: Date
}

interface UploadCompletionData {
  fileId: string
  fileName: string
}

export default function AdminFilesPage() {
  const { toast } = useToast()
  const [fileToDelete, setFileToDelete] = useState<FileListItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [entityType, setEntityType] = useState<string>('admin-uploads')
  const [entityId, setEntityId] = useState<string>('general')
  const [customEntityType, setCustomEntityType] = useState<string>('')

  const { data: files, isLoading, error, refetch } = api.file.getAdminFileList.useQuery()

  const deleteMutation = api.file.deleteAdminFile.useMutation()
  const viewMutation = api.file.getAdminFilePresignedUrl.useMutation()
  const uploadMutation = api.file.uploadFileAdmin.useMutation()

  // Opções de pastas predefinidas
  const entityTypeOptions = [
    { value: 'admin-uploads', label: 'Uploads Administrativos' },
    { value: 'editais', label: 'Editais' },
    { value: 'contratos', label: 'Contratos' },
    { value: 'atas', label: 'Atas de Reunião' },
    { value: 'historico_escolar', label: 'Histórico Escolar' },
    { value: 'comprovante_matricula', label: 'Comprovantes de Matrícula' },
    { value: 'custom', label: 'Personalizado' }, // Opção para digitar uma pasta personalizada
  ]

  const openDeleteDialog = (file: FileListItem) => {
    setFileToDelete(file)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setFileToDelete(null)
    setIsDeleteDialogOpen(false)
  }

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete, {
        onSuccess: (data) => {
          toast({ title: 'Sucesso', description: data.message })
          log.info(`Arquivo ${fileToDelete.objectName} excluído.`)
          refetch()
        },
        onError: (error) => {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          })
        },
        onSettled: () => {
          closeDeleteDialog()
        },
      })
    }
  }

  const handleViewFile = (file: FileListItem) => {
    viewMutation.mutate(file, {
      onSuccess: (data) => {
        window.open(data.url, '_blank')
      },
      onError: (error) => {
        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }

  const handleUploadComplete = (uploadData: UploadCompletionData) => {
    log.info(`Admin Upload Complete: ${JSON.stringify(uploadData)}`)
    toast({
      title: 'Upload Concluído',
      description: `Arquivo ${uploadData.fileName} enviado.`,
    })
    refetch()
  }

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file)
  }

  const handleUpload = () => {
    if (!uploadFile) return

    const finalEntityType =
      entityType === 'custom' ? customEntityType : entityType

    if (entityType === 'custom' && !customEntityType.trim()) {
      toast({
        title: 'Pasta inválida',
        description: 'Por favor, especifique uma pasta válida',
        variant: 'destructive',
      })
      return
    }

    // Convert file to base64 for upload
    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1]
      uploadMutation.mutate(
        {
          fileName: uploadFile.name,
          fileData: base64Data,
          mimeType: uploadFile.type,
          entityType: finalEntityType,
          entityId: entityId,
        },
        {
          onSuccess: (data) => {
            handleUploadComplete({
              fileId: data.fileId,
              fileName: uploadFile.name,
            })
            setUploadFile(null)
            setEntityType('')
            setEntityId('')
            setCustomEntityType('')
            refetch()
          },
          onError: (error) => {
            toast({
              title: 'Erro no upload',
              description: error.message || 'Erro ao fazer upload do arquivo',
              variant: 'destructive',
            })
          },
        }
      )
    }
    reader.readAsDataURL(uploadFile)
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // Definição de colunas para o TableComponent
  const columns: ColumnDef<FileListItem>[] = [
    {
      accessorKey: 'originalFilename',
      header: 'Nome Original',
      cell: ({ row }) => (
        <div
          className="font-medium truncate max-w-xs"
          title={row.original.originalFilename || '-'}
        >
          {row.original.originalFilename || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'objectName',
      header: 'Caminho (Objeto)',
      cell: ({ row }) => (
        <div className="truncate max-w-xs" title={row.original.objectName}>
          {row.original.objectName}
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Tamanho',
      cell: ({ row }) => formatBytes(row.original.size),
    },
    {
      accessorKey: 'lastModified',
      header: 'Última Modificação',
      cell: ({ row }) =>
        format(row.original.lastModified, 'dd/MM/yyyy HH:mm'),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewFile(file)}
              disabled={
                viewMutation.isPending && viewMutation.variables === file
              }
              title="Visualizar/Baixar"
            >
              {viewMutation.isPending && viewMutation.variables === file ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog(file)}
              disabled={
                deleteMutation.isPending && deleteMutation.variables === file
              }
              title="Excluir"
            >
              {deleteMutation.isPending && deleteMutation.variables === file ? (
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

  if (isLoading && !files) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Erro ao carregar arquivos: {error.message}
        <Button onClick={() => refetch()} className="ml-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <PagesLayout title="Gerenciamento de Arquivos (Admin)">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Faça upload de arquivos para o bucket. Selecione a pasta e o
            identificador para organizar os arquivos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="entityType">Pasta</Label>
                <Select
                  value={entityType}
                  onValueChange={(value) => setEntityType(value)}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Selecione uma pasta" />
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

              {entityType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customEntityType">
                    Nome da Pasta Personalizada
                  </Label>
                  <Input
                    id="customEntityType"
                    value={customEntityType}
                    onChange={(e) => setCustomEntityType(e.target.value)}
                    placeholder="Ex: projetos-2023"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="entityId">Identificador</Label>
                <Input
                  id="entityId"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="Ex: usuario-123"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador opcional para organizar arquivos na pasta
                </p>
              </div>
            </div>

            <FileUploader
              onFileSelect={handleFileSelect}
              selectedFile={uploadFile}
              maxSizeInMB={100}
            />

            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List Table */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Arquivos no Bucket</h2>
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner /> Carregando lista...
        </div>
      ) : files && files.length > 0 ? (
        <TableComponent
          columns={columns}
          data={files}
          searchableColumn="originalFilename"
          searchPlaceholder="Buscar por nome de arquivo..."
        />
      ) : (
        <p className="py-4 text-center text-muted-foreground">
          Nenhum arquivo encontrado no bucket.
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o arquivo{' '}
              <span className="font-semibold">
                {fileToDelete?.originalFilename || fileToDelete?.objectName}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeDeleteDialog}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PagesLayout>
  )
}