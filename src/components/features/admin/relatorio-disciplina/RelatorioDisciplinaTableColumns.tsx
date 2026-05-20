import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'

type RelatorioDisciplinaAdminItem = {
  projetoId: number
  projetoTitulo: string
  disciplinaNome: string | null
  professorNome: string
  departamento: string | undefined
  ano: number
  semestre: string
  relatorioId: number | null
  status: string
  professorAssinouEm: Date | null | undefined
  totalMonitores: number
  createdAt: Date | null | undefined
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'NOT_CREATED':
      return (
        <Badge variant="outline" className="border-gray-500 text-gray-700">
          Não criado
        </Badge>
      )
    case 'DRAFT':
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          Rascunho
        </Badge>
      )
    case 'SUBMITTED':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          Enviado
        </Badge>
      )
    case 'APPROVED':
      return <Badge className="bg-green-500">Aprovado</Badge>
    case 'REJECTED':
      return <Badge variant="destructive">Rejeitado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function createRelatorioDisciplinaColumns(): ColumnDef<RelatorioDisciplinaAdminItem>[] {
  return [
    {
      header: 'Disciplina',
      accessorKey: 'disciplinaNome',
      cell: ({ row }) => (
        <div className="max-w-[250px]">
          <div className="font-medium truncate">{row.original.disciplinaNome || row.original.projetoTitulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.ano}/{row.original.semestre === 'SEMESTRE_1' ? '1' : '2'}
          </div>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorNome',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professorNome}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento}</div>
        </div>
      ),
    },
    {
      header: 'Monitores',
      accessorKey: 'totalMonitores',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.totalMonitores}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Assinatura Professor',
      accessorKey: 'professorAssinouEm',
      cell: ({ row }) =>
        row.original.professorAssinouEm
          ? new Date(row.original.professorAssinouEm).toLocaleDateString('pt-BR')
          : '-',
    },
  ]
}

export { getStatusBadge }
