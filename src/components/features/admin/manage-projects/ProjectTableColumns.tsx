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
import type { ColumnDef, FilterFn } from "@tanstack/react-table"
import { Download, Eye, FileText, Hand, List, Trash2, Users } from "lucide-react"

// Custom filter function for disciplina (matches any disciplina code in the array)
const disciplinaFilterFn: FilterFn<ManageProjectItem> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const disciplinas = row.original.disciplinas
  if (!disciplinas || disciplinas.length === 0) return false
  const searchValue = String(filterValue).toLowerCase()
  return disciplinas.some(
    (d) => d.codigo.toLowerCase().includes(searchValue) || d.nome.toLowerCase().includes(searchValue)
  )
}

// Custom filter function for professor (matches professor name)
const professorFilterFn: FilterFn<ManageProjectItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const professorNome = row.original.professorResponsavelNome || ""
  const searchValue = String(filterValue).toLowerCase()
  return professorNome.toLowerCase().includes(searchValue)
}

interface ColumnActions {
  onPreview: (projeto: ManageProjectItem) => void
  onViewPDF: (projetoId: number) => void
  onViewFiles: (projeto: ManageProjectItem) => void
  onDelete: (projeto: ManageProjectItem) => void
  loadingPdfProjetoId: number | null
  isDeletingProject: boolean
  disciplinaFilterOptions?: { value: string; label: string }[]
  professorFilterOptions?: { value: string; label: string }[]
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
  return [
    {
      header: createFilterableHeader<ManageProjectItem>({
        title: "Projeto",
        filterType: "text",
        filterPlaceholder: "Buscar código ou nome...",
        wide: true,
        autocompleteOptions: actions.disciplinaFilterOptions,
      }),
      accessorKey: "disciplina",
      filterFn: disciplinaFilterFn,
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        return (
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
              <div className="text-xs text-muted-foreground">
                {codigoDisciplina} • {row.original.professorResponsavelNome}
              </div>
              {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamentoNome}</div>}
            </div>
          </div>
        )
      },
    },
    {
      id: "professorNome",
      header: createFilterableHeader<ManageProjectItem>({
        title: "Professor",
        filterType: "text",
        filterPlaceholder: "Buscar professor...",
        wide: true,
        autocompleteOptions: actions.professorFilterOptions,
      }),
      accessorKey: "professorResponsavelNome",
      filterFn: professorFilterFn,
      cell: ({ row }) => (
        <div className="text-sm text-gray-700">{row.original.professorResponsavelNome}</div>
      ),
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
