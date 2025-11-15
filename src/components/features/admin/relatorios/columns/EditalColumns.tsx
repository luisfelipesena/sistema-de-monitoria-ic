import { ColumnDef } from "@tanstack/react-table"
import type { EditalRelatorio } from "@/types"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"

export const editaisColumns: ColumnDef<EditalRelatorio>[] = [
  {
    id: "edital",
    accessorFn: (row) => row.edital.numeroEdital,
    header: "Edital",
    cell: ({ row }) => {
      const edital = row.original
      return (
        <div>
          <div className="font-medium">{edital.edital.numeroEdital}</div>
          <div className="text-sm text-muted-foreground">{edital.edital.titulo}</div>
        </div>
      )
    },
  },
  {
    header: "Período",
    cell: ({ row }) => {
      const edital = row.original
      return (
        <div>
          <div className="font-medium">
            {edital.periodo.ano}/{edital.periodo.semestre === "SEMESTRE_1" ? "1" : "2"}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(edital.periodo.dataInicio).toLocaleDateString("pt-BR")} -
            {new Date(edital.periodo.dataFim).toLocaleDateString("pt-BR")}
          </div>
        </div>
      )
    },
  },
  {
    header: "Status",
    cell: ({ row }) => {
      const edital = row.original
      return edital.edital.publicado ? (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Publicado
        </Badge>
      ) : (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Rascunho
        </Badge>
      )
    },
  },
  {
    header: "Data de Publicação",
    cell: ({ row }) => {
      const edital = row.original
      return edital.edital.dataPublicacao ? new Date(edital.edital.dataPublicacao).toLocaleDateString("pt-BR") : "-"
    },
  },
  {
    header: "Criado por",
    accessorKey: "criadoPor.username",
  },
]
