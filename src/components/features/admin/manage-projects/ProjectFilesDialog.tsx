import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner"
import { EmptyState } from "@/components/atoms/EmptyState"
import type { ManageProjectItem } from "@/types"
import { Download, FileText } from "lucide-react"

interface ProjectFile {
  objectName: string
  originalFilename: string
  size: number
  lastModified: Date
}

interface ProjectFilesDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ManageProjectItem | null
  files: ProjectFile[] | undefined
  isLoading: boolean
  onDownload: (objectName: string) => void
}

export function ProjectFilesDialog({
  isOpen,
  onClose,
  project,
  files,
  isLoading,
  onDownload,
}: ProjectFilesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Arquivos do Projeto</DialogTitle>
          <DialogDescription>{project && `Projeto: ${project.titulo}`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <LoadingSpinner message="Carregando arquivos..." />
          ) : files && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.objectName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{file.originalFilename}</div>
                    <div className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {file.lastModified.toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(file.objectName)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum arquivo encontrado"
              description="Este projeto não possui arquivos anexados."
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
