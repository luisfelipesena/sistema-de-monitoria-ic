import { ColumnDef } from "@tanstack/react-table"
import type { ProfessorRelatorio } from "@/types"

export const professoresColumns: ColumnDef<ProfessorRelatorio>[] = [
  {
    id: "professor",
    accessorFn: (row) => row.professor.nomeCompleto,
    header: "Professor",
    cell: ({ row }) => {
      const professor = row.original
      return (
        <div>
          <div className="font-medium">{professor.professor.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{professor.professor.emailInstitucional}</div>
          <div className="text-xs text-muted-foreground">{professor.departamento.sigla}</div>
        </div>
      )
    },
  },
  {
    header: "Projetos",
    accessorKey: "projetos",
    cell: ({ row }) => {
      const professor = row.original
      return (
        <div className="text-center">
          <div className="font-medium">{professor.projetos}</div>
          <div className="text-sm text-muted-foreground">({professor.projetosAprovados} aprovados)</div>
        </div>
      )
    },
  },
  {
    header: "Bolsas",
    cell: ({ row }) => {
      const professor = row.original
      return (
        <div className="text-center">
          <div className="font-medium">{professor.bolsasDisponibilizadas}</div>
          <div className="text-sm text-muted-foreground">de {professor.bolsasSolicitadas}</div>
        </div>
      )
    },
  },
]
