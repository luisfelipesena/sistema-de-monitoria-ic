import { TableComponent } from '@/components/layout/TableComponent'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import { Button } from '@/components/ui/button'
import type { DashboardProjectItem } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, Eye, Hand, List, Loader, Users } from 'lucide-react'

interface ProjectsTableProps {
  projetos: DashboardProjectItem[]
  groupedView: boolean
  loadingPdfId: number | null
  onAnalisarProjeto: (projetoId: number) => void
  onViewPdf: (projetoId: number) => void
}

export function ProjectsTable({
  projetos,
  groupedView,
  loadingPdfId,
  onAnalisarProjeto,
  onViewPdf,
}: ProjectsTableProps) {
  const columns: ColumnDef<DashboardProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: 'titulo',
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : 'N/A'
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{codigoDisciplina}</span>
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
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: 'voluntariosSolicitados',
      cell: ({ row }) => <div className="text-center">{row.original.voluntariosSolicitados || 0}</div>,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: 'totalInscritos',
      cell: ({ row }) => <div className="text-center text-base">{row.original.totalInscritos}</div>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => onAnalisarProjeto(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            Analisar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => onViewPdf(row.original.id)}
            disabled={loadingPdfId === row.original.id}
          >
            <Download className="h-4 w-4" />
            {loadingPdfId === row.original.id ? 'Carregando...' : 'Visualizar PDF'}
          </Button>
        </div>
      ),
    },
  ]

  return <TableComponent columns={columns} data={projetos} />
}
