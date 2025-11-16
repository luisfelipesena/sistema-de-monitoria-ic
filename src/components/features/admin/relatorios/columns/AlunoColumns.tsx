import { ColumnDef } from "@tanstack/react-table"
import type { AlunoRelatorio } from "@/types"
import { TIPO_INSCRICAO_ANY, TIPO_INSCRICAO_BOLSISTA, TIPO_INSCRICAO_VOLUNTARIO } from "@/types"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import { Badge } from "@/components/ui/badge"

export const alunosColumns: ColumnDef<AlunoRelatorio>[] = [
  {
    id: "aluno",
    accessorFn: (row) => row.aluno.nomeCompleto,
    header: "Aluno",
    cell: ({ row }) => {
      const aluno = row.original
      return (
        <div>
          <div className="font-medium">{aluno.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">Mat: {aluno.aluno.matricula}</div>
          <div className="text-sm text-muted-foreground">CR: {aluno.aluno.cr}</div>
        </div>
      )
    },
  },
  {
    header: "Projeto",
    cell: ({ row }) => {
      const aluno = row.original
      return (
        <div>
          <div className="font-medium truncate max-w-xs">{aluno.projeto.titulo}</div>
          <div className="text-sm text-muted-foreground">{aluno.projeto.professorResponsavel}</div>
        </div>
      )
    },
  },
  {
    header: "Status",
    cell: ({ row }) => {
      const aluno = row.original
      return <StatusBadge status={aluno.statusInscricao} />
    },
  },
  {
    header: "Tipo Pretendido",
    cell: ({ row }) => {
      const aluno = row.original
      return (
        <Badge variant="outline">
          {aluno.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA
            ? "Bolsista"
            : aluno.tipoVagaPretendida === TIPO_INSCRICAO_VOLUNTARIO
            ? "Voluntário"
            : aluno.tipoVagaPretendida === TIPO_INSCRICAO_ANY
            ? "Qualquer"
            : "N/A"}
        </Badge>
      )
    },
  },
]
