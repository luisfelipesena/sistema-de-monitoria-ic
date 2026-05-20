import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'

type AtaAdminItem = {
  id: number
  projetoId: number
  projetoTitulo: string
  professorResponsavel: string
  departamento: string | undefined
  ano: number
  semestre: string
  geradoPor: string | undefined
  dataGeracao: Date
  assinado: boolean
  dataAssinatura: Date | null
  status: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'RASCUNHO':
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          Rascunho
        </Badge>
      )
    case 'ASSINADO':
      return <Badge className="bg-green-500">Assinado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function createAtasColumns(): ColumnDef<AtaAdminItem>[] {
  return [
    {
      header: 'Projeto',
      accessorKey: 'projetoTitulo',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.original.projetoTitulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.ano}/{row.original.semestre === 'SEMESTRE_1' ? '1' : '2'}
          </div>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorResponsavel',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professorResponsavel}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento}</div>
        </div>
      ),
    },
    {
      header: 'Gerado por',
      accessorKey: 'geradoPor',
      cell: ({ row }) => row.original.geradoPor || '-',
    },
    {
      header: 'Data Geração',
      accessorKey: 'dataGeracao',
      cell: ({ row }) =>
        row.original.dataGeracao ? new Date(row.original.dataGeracao).toLocaleDateString('pt-BR') : '-',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Data Assinatura',
      accessorKey: 'dataAssinatura',
      cell: ({ row }) =>
        row.original.dataAssinatura ? new Date(row.original.dataAssinatura).toLocaleDateString('pt-BR') : '-',
    },
  ]
}

export { getStatusBadge }
