import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail } from "lucide-react"
import type { MonitorProject, SelectionState } from "@/types/monitor-selection"
import { SelectionActionsPanel } from "./SelectionActionsPanel"

interface SelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  project: MonitorProject | null
  selectedCandidates: SelectionState
  feedback: string
  onFeedbackChange: (value: string) => void
  onSelectCandidate: (inscricaoId: number, tipo: "bolsista" | "voluntario") => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function SelectionDialog({
  isOpen,
  onClose,
  project,
  selectedCandidates,
  feedback,
  onFeedbackChange,
  onSelectCandidate,
  onSubmit,
  isSubmitting,
}: SelectionDialogProps) {
  if (!project) return null

  const hasSelection = selectedCandidates.bolsistas.length > 0 || selectedCandidates.voluntarios.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Monitores</DialogTitle>
          <DialogDescription>{project.titulo}</DialogDescription>
        </DialogHeader>

        <SelectionActionsPanel
          project={project}
          selectedCandidates={selectedCandidates}
          feedback={feedback}
          onFeedbackChange={onFeedbackChange}
          onSelectCandidate={(id, tipo) => onSelectCandidate(id, tipo)}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting || !hasSelection}>
            <Mail className="h-4 w-4 mr-2" />
            {isSubmitting ? "Selecionando..." : "Confirmar Seleção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
