import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import { TableCell, TableRow } from "@/components/ui/table"
import { Star } from "lucide-react"
import { TIPO_VAGA_BOLSISTA } from "@/types"
import type { MonitorCandidate } from "@/types/monitor-selection"

interface CandidateRowProps {
  candidate: MonitorCandidate
}

export function CandidateRow({ candidate }: CandidateRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{candidate.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{candidate.aluno.matricula}</div>
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
