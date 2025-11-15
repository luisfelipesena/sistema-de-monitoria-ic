import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/atoms/StatusBadge'
import type { DepartamentoListItem } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'

interface GetColumnsProps {
  onEdit: (departamento: DepartamentoListItem) => void
  onDelete: (departamento: DepartamentoListItem) => void
}

export function getDepartmentColumns({ onEdit, onDelete }: GetColumnsProps): ColumnDef<DepartamentoListItem>[] {
  return [
    {
      accessorKey: 'nome',
      header: 'Departamento',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.sigla} • {row.original.instituto}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'coordenador',
      header: 'Coordenador',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.coordenador || '-'}</div>
      ),
    },
    {
      accessorKey: 'professores',
      header: 'Professores',
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.professores}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'cursos',
      header: 'Cursos',
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.cursos}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'disciplinas',
      header: 'Disciplinas',
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.disciplinas}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'projetos',
      header: 'Projetos',
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.original.projetos}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const departamento = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(departamento)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(departamento)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
