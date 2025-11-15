import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import type { ManageProjectItem } from "@/types"
import { PROJETO_STATUS_SUBMITTED } from "@/types"
import type { ColumnDef } from "@tanstack/react-table"
import { List, Loader, Users, Hand, Eye, FileText, Download, Trash2 } from "lucide-react"

interface ColumnActions {
  onPreview: (projeto: ManageProjectItem) => void
  onViewPDF: (projetoId: number) => void
  onViewFiles: (projeto: ManageProjectItem) => void
  onDelete: (projeto: ManageProjectItem) => void
  loadingPdfProjetoId: number | null
  isDeletingProject: boolean
}

export function createProjectColumns(
  actions: ColumnActions,
  groupedView: boolean
): ColumnDef<ManageProjectItem>[] {
  return [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Projeto
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
            <div className="text-xs text-muted-foreground">
              {codigoDisciplina} • {row.original.professorResponsavelNome}
            </div>
            {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamentoNome}</div>}
          </div>
        )
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsas
        </div>
      ),
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => <div className="text-center">{row.original.bolsasDisponibilizadas || 0}</div>,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: "voluntariosSolicitados",
      cell: ({ row }) => <div className="text-center">{row.original.voluntariosSolicitados || 0}</div>,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: "totalInscritos",
      cell: ({ row }) => <div className="text-center text-base">{row.original.totalInscritos}</div>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => {
        const projeto = row.original
        const isLoadingPdf = actions.loadingPdfProjetoId === projeto.id

        return (
          <div className="flex items-center gap-2">
            {projeto.status === PROJETO_STATUS_SUBMITTED && (
              <Button
                variant="primary"
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => actions.onPreview(projeto)}
              >
                <Eye className="h-4 w-4" />
                Analisar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex items-center gap-1"
              onClick={() => actions.onViewPDF(projeto.id)}
              disabled={isLoadingPdf}
            >
              <FileText className="h-4 w-4" />
              {isLoadingPdf ? "Carregando..." : "Ver PDF"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex items-center gap-1 md:hidden"
              onClick={() => actions.onViewFiles(projeto)}
            >
              <Download className="h-4 w-4" />
              Arquivos
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="rounded-full flex items-center gap-1"
              onClick={() => actions.onDelete(projeto)}
              disabled={actions.isDeletingProject}
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        )
      },
    },
  ]
}
