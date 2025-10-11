"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { cn } from "@/utils/cn"
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

interface FileUploadFieldProps {
  label: string
  accept?: string
  entityType: string
  entityId?: string
  currentFileId?: string | null
  onFileUploaded?: (fileId: string, fileName: string, file?: File) => void | Promise<void>
  onFileDeleted?: () => void
  required?: boolean
  description?: string
  disabled?: boolean
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error"

export function FileUploadField({
  label,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  entityType,
  entityId,
  currentFileId,
  onFileUploaded,
  onFileDeleted,
  required = false,
  description,
  disabled = false,
}: FileUploadFieldProps) {
  const { toast } = useToast()
  const [uploadState, setUploadState] = useState<UploadState>(currentFileId ? "success" : "idle")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{
    id: string
    name: string
    size?: number
    type?: string
  } | null>(currentFileId ? { id: currentFileId, name: "Arquivo atual" } : null)
  const [dragCounter, setDragCounter] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFileMutation = api.file.uploadFile.useMutation()
  const getPresignedUrlMutation = api.file.getPresignedUrlMutation.useMutation()

  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    const type = fileType?.toLowerCase() || ""

    if (type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    if (["pdf"].includes(extension || "")) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    if (["doc", "docx"].includes(extension || "")) {
      return <FileText className="h-8 w-8 text-blue-600" />
    }
    if (["xls", "xlsx", "csv"].includes(extension || "")) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return "Arquivo muito grande. Máximo 10MB permitido."
    }

    const allowedTypes = accept.split(",").map((t) => t.trim())
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedTypes.some((type) => type === fileExtension || file.type.startsWith(type.replace("*", "")))) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${accept}`
    }

    return null
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(",")[1]
        resolve(base64Data)
      }
      reader.onerror = reject
    })
  }

  const simulateProgress = useCallback(() => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 95) progress = 95
      setUploadProgress(progress)
      if (progress >= 95) {
        clearInterval(interval)
      }
    }, 200)
    return interval
  }, [])

  const processFile = async (file: File) => {
    const validation = validateFile(file)
    if (validation) {
      setUploadState("error")
      toast({
        title: "Erro",
        description: validation,
        variant: "destructive",
      })
      setTimeout(() => setUploadState("idle"), 3000)
      return
    }

    try {
      setUploadState("uploading")
      setUploadProgress(0)

      const progressInterval = simulateProgress()

      const base64Data = await convertFileToBase64(file)

      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
        entityType,
        entityId,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const newFile = {
        id: uploadResult.fileId || uploadResult.objectName,
        name: uploadResult.fileName || file.name,
        size: file.size,
        type: file.type,
      }

      setUploadedFile(newFile)
      setUploadState("success")

      if (onFileUploaded) {
        await onFileUploaded(newFile.id, newFile.name, file)
      }

      toast({
        title: "Sucesso!",
        description: `${file.name} foi enviado com sucesso!`,
      })
    } catch (error: any) {
      setUploadState("error")
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o arquivo.",
        variant: "destructive",
      })
      setTimeout(() => setUploadState("idle"), 3000)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
    event.target.value = ""
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev - 1)
    if (dragCounter <= 1) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)

    if (disabled || uploadState === "uploading") return

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file) {
      await processFile(file)
    }
  }

  const handleViewFile = async () => {
    if (!uploadedFile) return

    try {
      const url = await getPresignedUrlMutation.mutateAsync({
        fileId: uploadedFile.id,
        action: "view",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível abrir o arquivo.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadFile = async () => {
    if (!uploadedFile) return

    try {
      const url = await getPresignedUrlMutation.mutateAsync({
        fileId: uploadedFile.id,
        action: "download",
      })

      const link = document.createElement("a")
      link.href = url
      link.download = uploadedFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível baixar o arquivo.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadState("idle")
    setUploadProgress(0)
    onFileDeleted?.()
    toast({
      title: "Sucesso!",
      description: "Arquivo removido",
    })
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const getStateColor = () => {
    switch (uploadState) {
      case "success":
        return "text-green-600 border-green-300 bg-green-50"
      case "error":
        return "text-red-600 border-red-300 bg-red-50"
      case "uploading":
        return "text-blue-600 border-blue-300 bg-blue-50"
      default:
        return isDragging
          ? "text-blue-600 border-blue-400 bg-blue-50"
          : "text-gray-600 border-gray-300 hover:border-gray-400"
    }
  }

  const getStateIcon = () => {
    switch (uploadState) {
      case "uploading":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "error":
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <Upload className={cn("h-8 w-8", isDragging ? "text-blue-500" : "text-gray-400")} />
    }
  }

  const isInteractive = !disabled && uploadState !== "uploading"

  return (
    <div className="space-y-3">
      <Label htmlFor={`file-upload-${entityType}`} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <Input
        ref={fileInputRef}
        id={`file-upload-${entityType}`}
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        disabled={disabled || uploadState === "uploading"}
        className="hidden"
        aria-describedby={description ? `${entityType}-description` : undefined}
      />

      {uploadedFile && uploadState === "success" ? (
        <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getFileIcon(uploadedFile.name, uploadedFile.type)}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-900 truncate">{uploadedFile.name}</p>
                {uploadedFile.size && <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>}
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                Enviado
              </Badge>
            </div>

            <div className="flex items-center gap-1 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewFile}
                disabled={getPresignedUrlMutation.isPending}
                className="h-8 w-8 p-0"
                title="Visualizar arquivo"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadFile}
                disabled={getPresignedUrlMutation.isPending}
                className="h-8 w-8 p-0"
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={isInteractive ? handleSelectFile : undefined}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
              getStateColor(),
              isInteractive && "cursor-pointer hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed",
              "min-h-[140px] flex flex-col items-center justify-center"
            )}
            role="button"
            tabIndex={isInteractive ? 0 : -1}
            aria-label={`Área de upload para ${label}`}
            onKeyDown={(e) => {
              if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                handleSelectFile()
              }
            }}
          >
            <div className="flex flex-col items-center gap-3">
              {getStateIcon()}

              <div className="space-y-1">
                {uploadState === "uploading" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">Enviando arquivo...</p>
                    <div className="w-48 mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                    <p className="text-xs text-blue-500">{Math.round(uploadProgress)}%</p>
                  </div>
                ) : uploadState === "error" ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600">Erro no envio</p>
                    <p className="text-xs text-red-500">Clique para tentar novamente</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {isDragging ? "Solte o arquivo aqui" : "Arraste um arquivo ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {accept.replace(/\./g, "").toUpperCase()} • Máx: 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isDragging && uploadState === "idle" && (
            <div className="text-center">
              <Button variant="outline" onClick={handleSelectFile} disabled={disabled} className="px-6">
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
