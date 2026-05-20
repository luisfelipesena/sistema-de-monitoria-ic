import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableComponent } from "@/components/layout/TableComponent"
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner"
import { EmptyState } from "@/components/atoms/EmptyState"
import { Award, Save } from "lucide-react"
import { createAllocationTableColumns } from "./AllocationTableColumns"

interface AllocationProject {
  id: number
  titulo: string
  disciplinas: Array<{ codigo: string }>
  professorResponsavel: { nomeCompleto: string }
  departamento: { sigla: string | null }
  bolsasSolicitadas: number
  bolsasDisponibilizadas: number | null
}

interface AllocationTableProps {
  projects: AllocationProject[] | undefined
  isLoading: boolean
  editingAllocations: Record<number, number>
  onEditAllocation: (projectId: number, currentValue: number) => void
  onSaveAllocation: (projectId: number) => void
  onBulkSave: () => void
  onViewCandidates: (projectId: number) => void
  onAllocationChange: (projectId: number, value: number) => void
  isUpdating: boolean
  isBulkUpdating: boolean
}

export function AllocationTable({
  projects,
  isLoading,
  editingAllocations,
  onEditAllocation,
  onSaveAllocation,
  onBulkSave,
  onViewCandidates,
  onAllocationChange,
  isUpdating,
  isBulkUpdating,
}: AllocationTableProps) {
  const columns = createAllocationTableColumns({
    editingAllocations,
    onEditAllocation,
    onSaveAllocation,
    onViewCandidates,
    onAllocationChange,
    isUpdating,
  })

  const hasEdits = Object.keys(editingAllocations).length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Alocação de Bolsas
            {projects && (
              <Badge variant="outline" className="ml-2">
                {projects.length} projeto(s)
              </Badge>
            )}
          </div>
          {hasEdits && (
            <Button onClick={onBulkSave} disabled={isBulkUpdating}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Todas ({Object.keys(editingAllocations).length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner message="Carregando projetos..." />
        ) : projects && projects.length > 0 ? (
          <TableComponent
            columns={columns}
            data={projects}
            searchableColumn="titulo"
            searchPlaceholder="Buscar por título do projeto..."
          />
        ) : (
          <EmptyState
            icon={Award}
            title="Nenhum projeto encontrado"
            description="Não há projetos aprovados para o período selecionado."
          />
        )}
      </CardContent>
    </Card>
  )
}
