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
import { Button } from "@/components/ui/button"
import { createSemesterFilterOptions, createYearFilterOptions } from "@/hooks/useColumnFilters"
import {
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_LABELS,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
  type DashboardProjectItem,
} from "@/types"
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table"
import { Eye, Hand, List, Loader, Trash2, Users } from "lucide-react"
import { useState } from "react"

interface ProjectsTableProps {
  projetos: DashboardProjectItem[]
  groupedView: boolean
  deletingProjetoId: number | null
  onAnalisarProjeto: (projetoId: number) => void
  onDeleteProjeto: (projetoId: number) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
}

// Filter options
const statusFilterOptions = [
  { value: PROJETO_STATUS_DRAFT, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_DRAFT] },
  { value: PROJETO_STATUS_SUBMITTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_SUBMITTED] },
  { value: PROJETO_STATUS_APPROVED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_APPROVED] },
  { value: PROJETO_STATUS_REJECTED, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_REJECTED] },
]

export function ProjectsTable({
  projetos,
  groupedView,
  deletingProjetoId,
  onAnalisarProjeto,
  onDeleteProjeto,
  columnFilters,
  onColumnFiltersChange,
}: ProjectsTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const projetoToDelete = projetos.find((p) => p.id === deleteConfirmId)

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteProjeto(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const columns: ColumnDef<DashboardProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{codigoDisciplina}</span>
            {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamentoNome}</div>}
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
        filterType: "select",
        filterOptions: createYearFilterOptions(),
      }),
      accessorKey: "ano",
      cell: ({ row }) => <div className="text-center">{row.original.ano}</div>,
    },
    {
      header: createFilterableHeader<DashboardProjectItem>({
        title: "Semestre",
        filterType: "select",
        filterOptions: createSemesterFilterOptions(),
      }),
      accessorKey: "semestre",
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
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => onAnalisarProjeto(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            Detalhes
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => setDeleteConfirmId(row.original.id)}
            disabled={deletingProjetoId === row.original.id}
          >
            <Trash2 className="h-4 w-4" />
            {deletingProjetoId === row.original.id ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      ),
    },
  ]

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
