import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImportHistoryItem, SEMESTRE_1 } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, CheckCircle, Eye, Trash2, XCircle } from "lucide-react"

function getStatusBadge(status: string) {
  switch (status) {
    case "PROCESSANDO":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Processando
        </Badge>
      )
    case "CONCLUIDO":
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      )
    case "CONCLUIDO_COM_ERROS":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Concluído com Erros
        </Badge>
      )
    case "ERRO":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

interface CreateColumnsProps {
  onViewDetails: (id: number) => void
  onDelete: (id: number) => void
  isDeleting: boolean
}

export function createImportHistoryColumns({
  onViewDetails,
  onDelete,
  isDeleting,
}: CreateColumnsProps): ColumnDef<ImportHistoryItem>[] {
  return [
    {
      header: "Arquivo",
      accessorKey: "nomeArquivo",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nomeArquivo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.ano}/{row.original.semestre === SEMESTRE_1 ? "1" : "2"}
          </div>
        </div>
      ),
    },
    {
      header: "Projetos",
      accessorKey: "totalProjetos",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.totalProjetos}</div>
          <div className="text-xs text-muted-foreground">
            ✓ {row.original.projetosCriados} | ✗ {row.original.projetosComErro}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: "Importado por",
      accessorKey: "importadoPor.username",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.importadoPor.username}</div>
          <div className="text-sm text-muted-foreground">{row.original.importadoPor.email}</div>
        </div>
      ),
    },
    {
      header: "Data",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("pt-BR"),
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(row.original.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row.original.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]
}

export { getStatusBadge }
