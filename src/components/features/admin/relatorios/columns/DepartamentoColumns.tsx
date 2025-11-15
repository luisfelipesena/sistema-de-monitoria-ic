import { ColumnDef } from "@tanstack/react-table"
import type { DepartamentoRelatorio } from "@/types"
import { FileText } from "lucide-react"

export const departamentosColumns: ColumnDef<DepartamentoRelatorio>[] = [
  {
    id: "departamento",
    accessorFn: (row) => row.departamento.sigla || row.departamento.nome,
    header: "Departamento",
    cell: ({ row }) => {
      const departamento = row.original
      return (
        <div>
          <div className="font-medium">{departamento.departamento.sigla || departamento.departamento.nome}</div>
          <div className="text-sm text-muted-foreground">{departamento.departamento.nome}</div>
        </div>
      )
    },
  },
  {
    header: "Projetos",
    accessorKey: "projetos",
    cell: ({ row }) => {
      const departamento = row.original
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{departamento.projetos}</span>
          <span className="text-sm text-muted-foreground">({departamento.projetosAprovados} aprovados)</span>
        </div>
      )
    },
  },
  {
    header: "Bolsas",
    cell: ({ row }) => {
      const departamento = row.original
      return (
        <div>
          <div className="font-medium">{departamento.bolsasDisponibilizadas} disponibilizadas</div>
          <div className="text-sm text-muted-foreground">{departamento.bolsasSolicitadas} solicitadas</div>
        </div>
      )
    },
  },
]
