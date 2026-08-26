import { StatusBadge } from "@/components/atoms/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { TIPO_VAGA_BOLSISTA } from "@/types"
import type { MonitorCandidate } from "@/types/monitor-selection"
import { Star } from "lucide-react"

interface CandidateRowProps {
  candidate: MonitorCandidate
}

export function CandidateRow({ candidate }: CandidateRowProps) {
  const wasRejectedByStudent = candidate.status === "REJECTED_BY_STUDENT"
  const wasRemovedByProfessor = candidate.status === "WAITING_LIST"
  const isCurrentlySelected = candidate.status === "SELECTED_BOLSISTA" || candidate.status === "SELECTED_VOLUNTARIO"

  const rowClassName = wasRejectedByStudent
    ? "bg-red-50"
    : wasRemovedByProfessor
      ? "bg-orange-50"
      : isCurrentlySelected
        ? "bg-green-50"
        : ""

  return (
    <TableRow className={rowClassName}>
      <TableCell>
        <div>
          <div className="font-medium">{candidate.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{candidate.aluno.matricula}</div>
          {wasRejectedByStudent && (
            <div className="text-xs text-red-700 font-semibold mt-0.5">❌ Recusou bolsa</div>
          )}
          {wasRemovedByProfessor && (
            <div className="text-xs text-orange-600 font-medium mt-0.5">⚠️ Bolsa removida pelo professor</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500" />
          {candidate.aluno.cr?.toFixed(2) || "N/A"}
        </div>
      </TableCell>
      <TableCell>{Number(candidate.notaDisciplina)?.toFixed(1) || "N/A"}</TableCell>
      <TableCell>{Number(candidate.notaSelecao)?.toFixed(1) || "N/A"}</TableCell>
      <TableCell className="font-medium">{Number(candidate.notaFinal)?.toFixed(1) || "N/A"}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {(candidate.tipoVagaPretendida || "") === TIPO_VAGA_BOLSISTA ? "Bolsista" : "Voluntário"}
        </Badge>
      </TableCell>
      <TableCell>
        <StatusBadge status={candidate.status} />
      </TableCell>
    </TableRow>
  )
}
