import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TableComponent } from "@/components/layout/TableComponent"
import { EmptyState } from "@/components/atoms/EmptyState"
import { type TipoInscricao, type TipoVaga } from "@/types"
import { Users } from "lucide-react"
import { createCandidateTableColumns } from "./CandidateTableColumns"

interface CandidateData {
  id: number
  aluno: {
    nomeCompleto: string
    matricula: string | null
    cr: number | null
  }
  notaFinal: string | null
  tipoVagaPretendida: TipoInscricao | null
}

interface CandidateSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  candidates: CandidateData[] | undefined
  onAllocate: (inscricaoId: number, tipo: TipoVaga) => void
  isAllocating: boolean
}

export function CandidateSelectionDialog({
  isOpen,
  onClose,
  candidates,
  onAllocate,
  isAllocating,
}: CandidateSelectionDialogProps) {
  const columns = createCandidateTableColumns({
    onAllocate,
    isAllocating,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Candidatos do Projeto</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {candidates && candidates.length > 0 ? (
            <TableComponent
              columns={columns}
              data={candidates}
              searchableColumn="aluno.nomeCompleto"
              searchPlaceholder="Buscar por nome do aluno..."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum candidato encontrado"
              description="Não há candidatos para este projeto."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
