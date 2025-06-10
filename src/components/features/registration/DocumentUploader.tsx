"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { api } from "@/utils/api"
import { CheckCircle, Trash2, UploadCloud } from "lucide-react"
import { useState, type ChangeEvent } from "react"
import { toast } from "sonner"

export interface UploadedFile {
  fileId: string
  fileName: string
  tipoDocumento: string
}

interface DocumentUploaderProps {
  requiredDocs: { tipo: string; nome: string }[]
  onUploadComplete: (uploadedFiles: UploadedFile[]) => void
}

export function DocumentUploader({ requiredDocs, onUploadComplete }: DocumentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const getUploadUrlMutation = api.files.getUploadUrl.useMutation()

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, tipoDocumento: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Arquivo muito grande.", { description: "O tamanho máximo do arquivo é 5MB." })
      return
    }

    try {
      const { uploadUrl, fileId } = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        category: "inscricao",
        // This should come from the session
        userId: 1,
      })

      const xhr = new XMLHttpRequest()
      xhr.open("PUT", uploadUrl, true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setUploadProgress((prev) => ({ ...prev, [tipoDocumento]: percentComplete }))
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const newFile = { fileId, fileName: file.name, tipoDocumento }
          const updatedFiles = [...uploadedFiles.filter((f) => f.tipoDocumento !== tipoDocumento), newFile]
          setUploadedFiles(updatedFiles)
          onUploadComplete(updatedFiles)
          toast.success("Upload concluído!", { description: file.name })
        } else {
          toast.error("Falha no upload.", { description: `O servidor retornou o status ${xhr.status}` })
        }
        setUploadProgress((prev) => ({ ...prev, [tipoDocumento]: 0 }))
      }

      xhr.onerror = () => {
        toast.error("Erro de rede.", { description: "Não foi possível fazer o upload do arquivo." })
        setUploadProgress((prev) => ({ ...prev, [tipoDocumento]: 0 }))
      }

      xhr.send(file)
    } catch (error: any) {
      toast.error("Falha ao obter URL de upload.", { description: error.message })
    }
  }

  const removeFile = (tipoDocumento: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.tipoDocumento !== tipoDocumento)
    setUploadedFiles(updatedFiles)
    onUploadComplete(updatedFiles)
  }

  return (
    <div className="space-y-4">
      {requiredDocs.map((doc) => {
        const uploaded = uploadedFiles.find((f) => f.tipoDocumento === doc.tipo)
        const progress = uploadProgress[doc.tipo]

        return (
          <div key={doc.tipo} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-semibold">{doc.nome}</p>
              {uploaded ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground truncate max-w-xs">{uploaded.fileName}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(doc.tipo)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button asChild variant="outline">
                  <label htmlFor={`file-upload-${doc.tipo}`} className="cursor-pointer">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Enviar
                    <Input
                      id={`file-upload-${doc.tipo}`}
                      type="file"
                      className="sr-only"
                      onChange={(e) => handleFileChange(e, doc.tipo)}
                      disabled={!!progress}
                    />
                  </label>
                </Button>
              )}
            </div>
            {progress > 0 && progress < 100 && <Progress value={progress} className="mt-2" />}
          </div>
        )
      })}
    </div>
  )
}
