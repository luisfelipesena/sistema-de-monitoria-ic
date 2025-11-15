import { ColumnDef } from "@tanstack/react-table"
import type { DisciplinaRelatorio } from "@/types"

export const disciplinasColumns: ColumnDef<DisciplinaRelatorio>[] = [
  {
    id: "disciplina",
    accessorFn: (row) => `${row.disciplina.codigo} - ${row.disciplina.nome}`,
    header: "Disciplina",
    cell: ({ row }) => {
      const disciplina = row.original
      return (
        <div>
          <div className="font-medium">{disciplina.disciplina.codigo}</div>
          <div className="text-sm text-muted-foreground">{disciplina.disciplina.nome}</div>
          <div className="text-xs text-muted-foreground">{disciplina.departamento.sigla}</div>
        </div>
      )
    },
  },
  {
    header: "Projetos",
    accessorKey: "projetos",
    cell: ({ row }) => {
      const disciplina = row.original
      return (
        <div className="text-center">
          <div className="font-medium">{disciplina.projetos}</div>
          <div className="text-sm text-muted-foreground">({disciplina.projetosAprovados} aprovados)</div>
        </div>
      )
    },
  },
]
