import { StatusBadge } from "@/components/atoms/StatusBadge"
import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createSemesterFilterOptions, createYearFilterOptions } from "@/hooks/useColumnFilters"
import {
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_LABELS,
  PROJETO_STATUS_PENDING_REVISION,
  PROJETO_STATUS_PENDING_SIGNATURE,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
  type DashboardProjectItem,
} from "@/types"
import { api } from "@/utils/api"
import type { ColumnDef, ColumnFiltersState, FilterFn } from "@tanstack/react-table"
import { Hand, List, Users } from "lucide-react"
import { useMemo, useState } from "react"

interface ProjectsTableProps {
  projetos: DashboardProjectItem[]
  deletingProjetoId: number | null
  onAnalisarProjeto: (projetoId: number) => void
  onDeleteProjeto: (projetoId: number) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
}

// Filter options
const statusFilterOptions = [
  { value: PROJETO_STATUS_DRAFT, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_DRAFT] },
  { value: PROJETO_STATUS_PENDING_SIGNATURE, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_PENDING_SIGNATURE] },
  { value: PROJETO_STATUS_PENDING_REVISION, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_PENDING_REVISION] },
  { value: PROJETO_STATUS_SUBMITTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_SUBMITTED] },
  { value: PROJETO_STATUS_APPROVED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_APPROVED] },
  { value: PROJETO_STATUS_REJECTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_REJECTED] },
]

// Custom filter function for disciplina (matches any disciplina code in the array)
const disciplinaFilterFn: FilterFn<DashboardProjectItem> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const disciplinas = row.original.disciplinas
  if (!disciplinas || disciplinas.length === 0) return false
  const searchValue = String(filterValue).toLowerCase()
  return disciplinas.some(
    (d) => d.codigo.toLowerCase().includes(searchValue) || d.nome.toLowerCase().includes(searchValue)
  )
}

export function ProjectsTable({
  projetos,
  deletingProjetoId,
  onAnalisarProjeto,
  onDeleteProjeto,
  columnFilters,
  onColumnFiltersChange,
}: ProjectsTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const projetoToDelete = projetos.find((p) => p.id === deleteConfirmId)

  // Fetch disciplinas for autocomplete filter
  const { data: disciplinas } = api.discipline.getDisciplines.useQuery()

  // Create disciplina filter options from fetched data
  const disciplinaFilterOptions = useMemo(() => {
    if (!disciplinas) return []
    return disciplinas.map((d) => ({
      value: d.codigo,
      label: `${d.codigo} - ${d.nome}`,
    }))
  }, [disciplinas])

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteProjeto(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const columns: ColumnDef<DashboardProjectItem>[] = useMemo(
    () => [
      {
        header: createFilterableHeader<DashboardProjectItem>({
          title: "Componente curricular",
          filterType: "text",
          filterPlaceholder: "Buscar código ou nome...",
          wide: true,
          autocompleteOptions: disciplinaFilterOptions,
        }),
        accessorKey: "disciplina",
        filterFn: disciplinaFilterFn,
        cell: ({ row }) => {
          const disciplinas = row.original.disciplinas
          const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
          return (
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-base text-gray-900">{codigoDisciplina}</span>
            </div>
          )
        },
      },
      {
        header: createFilterableHeader<DashboardProjectItem>({
          title: "Status",
          filterType: "multiselect",
          filterOptions: statusFilterOptions,
        }),
        accessorKey: "status",
        filterFn: multiselectFilterFn,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        header: createFilterableHeader<DashboardProjectItem>({
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
        header: createFilterableHeader<DashboardProjectItem>({
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
    ],
    [deletingProjetoId, disciplinaFilterOptions, onAnalisarProjeto]
  )

  return (
    <>
      <TableComponent
        columns={columns}
        data={projetos}
        columnFilters={columnFilters}
        onColumnFiltersChange={onColumnFiltersChange}
      />
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto{" "}
              <strong>{projetoToDelete?.disciplinas?.[0]?.codigo || projetoToDelete?.titulo}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
