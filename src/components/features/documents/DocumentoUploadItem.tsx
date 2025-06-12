import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { Eye, Upload, FileText } from 'lucide-react'
import { useState } from 'react'

interface DocumentoUploadItemProps {
  documento: {
    id: string
    nome: string
    tipo: string
    fileId?: string
    fileName?: string
    status: 'valid' | 'pending' | 'expired'
    ultimaAtualizacao?: string
    required?: boolean
  }
  onUpload?: (file: File, documentType: string) => void
  onView?: (fileId: string) => void
  isUploading?: boolean
  showActions?: boolean
}

export function DocumentoUploadItem({
  documento,
  onUpload,
  onView,
  isUploading = false,
  showActions = true,
}: DocumentoUploadItemProps) {
  const { toast } = useToast()
  const [isViewing, setIsViewing] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo PDF ou imagem',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB',
        variant: 'destructive',
      })
      return
    }

    if (onUpload) {
      onUpload(file, documento.tipo)
    }
  }

  const handleView = async () => {
    if (!documento.fileId) {
      toast({
        title: 'Arquivo não encontrado',
        description: 'Este documento ainda não foi enviado.',
        variant: 'destructive',
      })
      return
    }

    setIsViewing(true)
    try {
      if (onView) {
        onView(documento.fileId)
      } else {
        // Default behavior using tRPC
        // This would use the file router to get presigned URL
        // const presignedUrl = await getPresignedUrl({ fileId: documento.fileId })
        // window.open(presignedUrl, '_blank')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao visualizar',
        description: error.message || 'Não foi possível abrir o arquivo',
        variant: 'destructive',
      })
    } finally {
      setIsViewing(false)
    }
  }

  const getStatusColor = () => {
    switch (documento.status) {
      case 'valid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'expired':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = () => {
    switch (documento.status) {
      case 'valid':
        return 'Válido'
      case 'pending':
        return 'Pendente'
      case 'expired':
        return 'Expirado'
      default:
        return 'Não enviado'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{documento.nome}</span>
              {documento.required && (
                <Badge variant="outline" className="text-xs">
                  Obrigatório
                </Badge>
              )}
            </div>
            
            {documento.fileName && (
              <p className="text-sm text-muted-foreground truncate">
                📄 {documento.fileName}
              </p>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor()} className="text-xs">
                {getStatusText()}
              </Badge>
              
              {documento.ultimaAtualizacao && (
                <span className="text-xs text-muted-foreground">
                  Atualizado em: {new Date(documento.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  id={`upload-${documento.id}`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`upload-${documento.id}`)?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="mr-2">
                        <Spinner />
                      </div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {documento.fileId ? 'Alterar' : 'Enviar'}
                    </>
                  )}
                </Button>
              </div>

              {/* View Button */}
              {documento.fileId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleView}
                  disabled={isViewing}
                >
                  {isViewing ? (
                    <>
                      <div className="mr-2">
                        <Spinner />
                      </div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}