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
import { PROJETO_STATUS_APPROVED } from "@/types"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ProjectDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ManageProjectItem | null
  onConfirm: () => void
  isDeleting: boolean
}

export function ProjectDeleteDialog({
  isOpen,
  onClose,
  project,
  onConfirm,
  isDeleting,
}: ProjectDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Projeto</DialogTitle>
          <DialogDescription>{project && `Projeto: ${project.titulo}`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">Atenção! Esta ação é irreversível</h4>
              <p className="text-sm text-red-700 mt-1">
                O projeto será removido permanentemente do sistema. Todos os dados relacionados, incluindo
                inscrições e documentos, serão perdidos.
              </p>
              {project && project.status === PROJETO_STATUS_APPROVED && (
                <p className="text-sm text-red-800 mt-2 font-medium">
                  ⚠️ Este projeto está aprovado e pode ter inscrições ativas de estudantes.
                </p>
              )}
              {project && project.totalInscritos > 0 && (
                <p className="text-sm text-red-800 mt-2 font-medium">
                  📋 Este projeto possui {project.totalInscritos} inscrição(ões) que também serão removidas.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Removendo..." : "Confirmar Remoção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
