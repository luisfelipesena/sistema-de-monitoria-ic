import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { ManageProjectItem } from "@/types"

interface ProjectRejectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ManageProjectItem | null
  feedback: string
  onFeedbackChange: (value: string) => void
  onConfirm: () => void
  isRejecting: boolean
}

export function ProjectRejectDialog({
  isOpen,
  onClose,
  project,
  feedback,
  onFeedbackChange,
  onConfirm,
  isRejecting,
}: ProjectRejectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar Projeto</DialogTitle>
          <DialogDescription>{project && `Projeto: ${project.titulo}`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
            <Textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Descreva os motivos da rejeição para orientar o professor..."
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isRejecting}>
            {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
