import { createFilterableHeader } from '@/components/layout/DataTableFilterHeader'
import { multiselectFilterFn } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'

const ataStatusFilterOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'ASSINADO', label: 'Assinado' },
]

export type AtaAdminItem = {
  id: number
  projetoId: number
  projetoTitulo: string
  professorResponsavel: string
  departamento: string | undefined
  ano: number
  semestre: string
  geradoPor: string | undefined
  dataGeracao: Date | null
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

export interface AtasColumnActions {
  onViewPdf?: (ata: AtaAdminItem) => void
}

export function createAtasColumns(actions?: AtasColumnActions): ColumnDef<AtaAdminItem>[] {
  return [
    {
      header: createFilterableHeader<AtaAdminItem>({
        title: 'Projeto',
        filterType: 'text',
        filterPlaceholder: 'Buscar por projeto...',
      }),
      id: 'projetoTitulo',
      accessorFn: (row) => row.projetoTitulo,
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
      header: createFilterableHeader<AtaAdminItem>({
        title: 'Professor',
        filterType: 'text',
        filterPlaceholder: 'Buscar por professor...',
      }),
      id: 'professorResponsavel',
      accessorFn: (row) => row.professorResponsavel,
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
      header: createFilterableHeader<AtaAdminItem>({
        title: 'Status',
        filterType: 'multiselect',
        filterOptions: ataStatusFilterOptions,
      }),
      accessorKey: 'status',
      filterFn: multiselectFilterFn,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Data Assinatura',
      accessorKey: 'dataAssinatura',
      cell: ({ row }) =>
        row.original.dataAssinatura ? new Date(row.original.dataAssinatura).toLocaleDateString('pt-BR') : '-',
    },
    {
      id: 'acoes',
      header: 'Ações',
      cell: ({ row }) =>
        actions?.onViewPdf ? (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onViewPdf!(row.original)}
              className="h-8 gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Ver PDF</span>
            </Button>
          </div>
        ) : null,
    },
  ]
}

export { getStatusBadge }
