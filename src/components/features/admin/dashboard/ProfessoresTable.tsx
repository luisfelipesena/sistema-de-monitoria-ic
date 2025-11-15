import { TableComponent } from '@/components/layout/TableComponent'
import { Button } from '@/components/ui/button'
import type { UserListItem } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { Mail, Pencil, User } from 'lucide-react'

interface ProfessoresTableProps {
  professores: UserListItem[]
  onEditarUsuario: (userId: number, tipo: 'professor' | 'aluno') => void
}

export function ProfessoresTable({ professores, onEditarUsuario }: ProfessoresTableProps) {
  const columns: ColumnDef<UserListItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome do Professor
        </div>
      ),
      accessorKey: 'username',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => onEditarUsuario(row.original.id, 'professor')}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
      ),
    },
  ]

  return <TableComponent columns={columns} data={professores} />
}
