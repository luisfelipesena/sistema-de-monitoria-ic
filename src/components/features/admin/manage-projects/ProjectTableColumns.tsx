import { StatusBadge } from "@/components/atoms/StatusBadge"
import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { multiselectFilterFn } from "@/components/layout/TableComponent"
import { Button } from "@/components/ui/button"
import { createSemesterFilterOptions, createYearFilterOptions } from "@/hooks/useColumnFilters"
import type { ManageProjectItem } from "@/types"
import {
    PROJETO_STATUS_APPROVED,
    PROJETO_STATUS_DRAFT,
    PROJETO_STATUS_LABELS,
    PROJETO_STATUS_PENDING_SIGNATURE,
    PROJETO_STATUS_REJECTED,
    PROJETO_STATUS_SUBMITTED,
} from "@/types"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Eye, FileText, List, Trash2 } from "lucide-react"

interface ColumnActions {
  onPreview: (projeto: ManageProjectItem) => void
  onViewPDF: (projetoId: number) => void
  onViewFiles: (projeto: ManageProjectItem) => void
  onDelete: (projeto: ManageProjectItem) => void
  loadingPdfProjetoId: number | null
  isDeletingProject: boolean
  disciplinaFilterOptions?: { value: string; label: string }[]
  professorFilterOptions?: { value: string; label: string }[]
  departamentoFilterOptions?: { value: string; label: string }[]
}

// Filter options
const statusFilterOptions = [
  { value: PROJETO_STATUS_DRAFT, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_DRAFT] },
  { value: PROJETO_STATUS_PENDING_SIGNATURE, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_PENDING_SIGNATURE] },
  { value: PROJETO_STATUS_SUBMITTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_SUBMITTED] },
  { value: PROJETO_STATUS_APPROVED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_APPROVED] },
  { value: PROJETO_STATUS_REJECTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_REJECTED] },
]

export function createProjectColumns(actions: ColumnActions, groupedView: boolean): ColumnDef<ManageProjectItem>[] {
  const departamentoFilterOptions = actions.departamentoFilterOptions ?? []

  return [
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Projeto",
        filterType: "text",
        filterPlaceholder: "Buscar projeto...",
        wide: true,
      }),
      accessorKey: "titulo",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div>
            <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
            {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamentoNome}</div>}
          </div>
        </div>
      ),
    },
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Disciplina",
        filterType: "text",
        filterPlaceholder: "Buscar código da disciplina...",
        autocompleteOptions: actions.disciplinaFilterOptions,
      }),
      id: "disciplina",
      accessorFn: (row) => row.disciplinas[0]?.codigo ?? "",
      cell: ({ row }) => {
        const codigoDisciplina = row.original.disciplinas.length > 0 ? row.original.disciplinas[0].codigo : "—"
        return <div className="font-medium text-gray-600">{codigoDisciplina}</div>
      },
    },
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Departamento",
        filterType: "multiselect",
        filterOptions: departamentoFilterOptions,
      }),
      accessorKey: "departamentoId",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => {
        const departamentoValue = row.original.departamentoId != null ? String(row.original.departamentoId) : null
        const departamentoLabel = departamentoFilterOptions.find((opt) => opt.value === departamentoValue)?.label
        return <span className="font-medium text-gray-600">{departamentoLabel ?? row.original.departamentoSigla ?? "-"}</span>
      },
    },
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Status",
        filterType: "multiselect",
        filterOptions: statusFilterOptions,
      }),
      accessorKey: "status",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Ano",
        filterType: "number",
        filterOptions: createYearFilterOptions(),
        filterPlaceholder: "Ex: 2025",
      }),
      accessorKey: "ano",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <div className="text-center">{row.original.ano}</div>,
    },
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Semestre",
        filterType: "multiselect",
        filterOptions: createSemesterFilterOptions(),
      }),
      accessorKey: "semestre",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <div className="text-center">{row.original.semestre === "SEMESTRE_1" ? "1º" : "2º"}</div>,
    },
    {
      header: () => <div className="text-center">Vagas</div>,
      accessorKey: "bolsasDisponibilizadas",
      size: 90,
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas || 0
        const vol = row.original.voluntariosSolicitados || 0
        return (
          <div className="text-center text-xs tabular-nums">
            <span title="Bolsistas">{bolsas}B</span>
            <span className="text-muted-foreground mx-0.5">/</span>
            <span title="Voluntários">{vol}V</span>
          </div>
        )
      },
    },
    {
      header: () => <div className="text-center">Inscritos</div>,
      accessorKey: "totalInscritos",
      size: 70,
      cell: ({ row }) => <div className="text-center text-base tabular-nums">{row.original.totalInscritos}</div>,
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

            {projeto.status === PROJETO_STATUS_APPROVED && (
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
            )}

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

