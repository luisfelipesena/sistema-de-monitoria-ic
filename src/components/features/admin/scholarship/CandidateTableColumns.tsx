import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TIPO_INSCRICAO_ANY, TIPO_INSCRICAO_BOLSISTA, TIPO_INSCRICAO_VOLUNTARIO, TIPO_VAGA_BOLSISTA, TIPO_VAGA_VOLUNTARIO, type TipoInscricao, type TipoVaga } from "@/types"
import type { ColumnDef } from "@tanstack/react-table"

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

interface CandidateTableColumnsProps {
  onAllocate: (inscricaoId: number, tipo: TipoVaga) => void
  isAllocating: boolean
}

export function createCandidateTableColumns(
  props: CandidateTableColumnsProps
): ColumnDef<CandidateData, unknown>[] {
  return [
    {
      header: "Aluno",
      id: "aluno",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">Mat: {row.original.aluno.matricula}</div>
        </div>
      ),
    },
    {
      header: "CR",
      id: "cr",
      cell: ({ row }) => row.original.aluno.cr?.toFixed(2) || "-",
    },
    {
      header: "Nota Final",
      id: "notaFinal",
      cell: ({ row }) => row.original.notaFinal || "-",
    },
    {
      header: "Tipo Pretendido",
      id: "tipoVaga",
      cell: ({ row }) => {
        const tipo = row.original.tipoVagaPretendida
        let label = "Qualquer"
        if (tipo === TIPO_INSCRICAO_BOLSISTA) label = "Bolsista"
        else if (tipo === TIPO_INSCRICAO_VOLUNTARIO) label = "Voluntário"
        return <Badge variant="outline">{label}</Badge>
      },
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => props.onAllocate(row.original.id, TIPO_VAGA_BOLSISTA)}
            disabled={props.isAllocating}
          >
            Bolsista
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => props.onAllocate(row.original.id, TIPO_VAGA_VOLUNTARIO)}
            disabled={props.isAllocating}
          >
            Voluntário
          </Button>
        </div>
      ),
    },
  ]
}
