import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'

type SelecaoAdminItem = {
  id: number
  titulo: string
  ano: number
  semestre: string
  professorResponsavel: string
  departamento: string | undefined
  totalInscritos: number
  bolsistasDisponibilizados: number
  bolsistasSelecionados: number
  voluntariosSelecionados: number
  hasAta: boolean
  ataAssinada: boolean
  selecaoStatus: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDENTE':
      return (
        <Badge variant="outline" className="border-gray-500 text-gray-700">
          Pendente
        </Badge>
      )
    case 'EM_SELECAO':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          Em Seleção
        </Badge>
      )
    case 'RASCUNHO':
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          Ata em Rascunho
        </Badge>
      )
    case 'ASSINADO':
      return <Badge className="bg-green-500">Concluído</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function createSelecaoColumns(): ColumnDef<SelecaoAdminItem>[] {
  return [
    {
      header: 'Projeto',
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.original.titulo}</div>
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
      header: 'Inscritos',
      accessorKey: 'totalInscritos',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.totalInscritos}</div>
        </div>
      ),
    },
    {
      header: 'Bolsistas',
      accessorKey: 'bolsistasSelecionados',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">
            {row.original.bolsistasSelecionados}/{row.original.bolsistasDisponibilizados}
          </div>
          <div className="text-xs text-muted-foreground">selecionados</div>
        </div>
      ),
    },
    {
      header: 'Voluntários',
      accessorKey: 'voluntariosSelecionados',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.voluntariosSelecionados}</div>
          <div className="text-xs text-muted-foreground">selecionados</div>
        </div>
      ),
    },
    {
      header: 'Ata',
      accessorKey: 'hasAta',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.hasAta ? (
            row.original.ataAssinada ? (
              <Badge className="bg-green-500">Assinada</Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                Rascunho
              </Badge>
            )
          ) : (
            <Badge variant="outline">Não criada</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'selecaoStatus',
      cell: ({ row }) => getStatusBadge(row.original.selecaoStatus),
    },
  ]
}

export { getStatusBadge }
