import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import {
  ALLOCATION_STATUS_NAO_ALOCADO,
  ALLOCATION_STATUS_PARCIALMENTE_ALOCADO,
  ALLOCATION_STATUS_SOBRE_ALOCADO,
  ALLOCATION_STATUS_TOTALMENTE_ALOCADO,
  type AllocationStatus,
} from "@/types"
import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, Save } from "lucide-react"

interface AllocationProject {
  id: number
  titulo: string
  disciplinas: Array<{ codigo: string }>
  professorResponsavel: { nomeCompleto: string }
  departamento: { sigla: string | null }
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number | null
}

interface AllocationTableColumnsProps {
  editingAllocations: Record<number, number>
  onEditAllocation: (projectId: number, currentValue: number) => void
  onSaveAllocation: (projectId: number) => void
  onViewCandidates: (projectId: number) => void
  onAllocationChange: (projectId: number, value: number) => void
  isUpdating: boolean
}

function getAllocationStatus(project: AllocationProject): AllocationStatus {
  const disponibilizadas = project.bolsasDisponibilizadas || 0
  const solicitadas = project.bolsasSolicitadas

  if (disponibilizadas === 0) return ALLOCATION_STATUS_NAO_ALOCADO
  if (disponibilizadas < solicitadas) return ALLOCATION_STATUS_PARCIALMENTE_ALOCADO
  if (disponibilizadas === solicitadas) return ALLOCATION_STATUS_TOTALMENTE_ALOCADO
  return ALLOCATION_STATUS_SOBRE_ALOCADO
}

export function createAllocationTableColumns(
  props: AllocationTableColumnsProps
): ColumnDef<AllocationProject, unknown>[] {
  return [
    {
      header: "Projeto",
      accessorKey: "titulo",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.disciplinas.map((d) => d.codigo).join(", ")}
          </div>
        </div>
      ),
    },
    {
      header: "Professor",
      accessorKey: "professorResponsavel.nomeCompleto",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professorResponsavel.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento.sigla}</div>
        </div>
      ),
    },
    {
      header: "Solicitadas",
      accessorKey: "bolsasSolicitadas",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.bolsasSolicitadas}</div>
          <div className="text-xs text-muted-foreground">bolsas</div>
        </div>
      ),
    },
    {
      header: "Disponibilizadas",
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => {
        const projectId = row.original.id
        const isEditing = props.editingAllocations.hasOwnProperty(projectId)
        const currentValue = row.original.bolsasDisponibilizadas || 0

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                className="w-20"
                value={props.editingAllocations[projectId]}
                onChange={(e) => props.onAllocationChange(projectId, parseInt(e.target.value) || 0)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => props.onSaveAllocation(projectId)}
                disabled={props.isUpdating}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{currentValue}</span>
            <Button variant="outline" size="sm" onClick={() => props.onEditAllocation(projectId, currentValue)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const status = getAllocationStatus(row.original)
        return <StatusBadge status={status} />
      },
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => props.onViewCandidates(row.original.id)}>
          <Eye className="h-4 w-4 mr-1" />
          Candidatos
        </Button>
      ),
    },
  ]
}
