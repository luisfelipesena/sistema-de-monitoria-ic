import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ManageProjectItem } from "@/types"
import { Check, X, FileText } from "lucide-react"

interface ProjectAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ManageProjectItem | null
  onApprove: () => void
  onReject: () => void
  onViewPDF: (projetoId: number) => void
  isApproving: boolean
  isLoadingPdf: boolean
}

export function ProjectAnalysisDialog({
  isOpen,
  onClose,
  project,
  onApprove,
  onReject,
  onViewPDF,
  isApproving,
  isLoadingPdf,
}: ProjectAnalysisDialogProps) {
  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Análise do Projeto</DialogTitle>
          <DialogDescription>
            Projeto: {project.titulo} - {project.professorResponsavelNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Visualizar Documento</h4>
              <p className="text-sm text-blue-700">
                Revise o PDF do projeto com a assinatura do professor antes de tomar uma decisão
              </p>
            </div>
            <Button variant="outline" onClick={() => onViewPDF(project.id)} disabled={isLoadingPdf}>
              {isLoadingPdf ? "Carregando..." : "Abrir PDF"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Etapas do processo:</strong>
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Visualize o PDF do projeto clicando em "Abrir PDF"</li>
              <li>Analise o conteúdo e a assinatura do professor</li>
              <li>Aprove ou rejeite o projeto usando os botões abaixo</li>
              <li>Se aprovado, o projeto ficará disponível para assinatura administrativa</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onReject}>
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            variant="default"
            onClick={onApprove}
            disabled={isApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {isApproving ? "Aprovando..." : "Aprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
