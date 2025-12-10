import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'

type RelatorioMonitorAdminItem = {
  id: number
  monitorNome: string
  monitorMatricula: string | null
  projetoId: number
  projetoTitulo: string
  disciplinaNome: string | null
  professorNome: string
  departamento: string | undefined
  tipo: string | null
  ano: number
  semestre: string
  status: string
  alunoAssinouEm: Date | null
  professorAssinouEm: Date | null
  createdAt: Date
}

function getStatusBadge(status: string, alunoAssinouEm: Date | null, professorAssinouEm: Date | null) {
  if (alunoAssinouEm && professorAssinouEm) {
    return <Badge className="bg-green-500">Completo</Badge>
  }
  if (status === 'SUBMITTED' && !alunoAssinouEm) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
        Aguardando Aluno
      </Badge>
    )
  }
  if (status === 'DRAFT') {
    return (
      <Badge variant="outline" className="border-gray-500 text-gray-700">
        Rascunho
      </Badge>
    )
  }
  return <Badge variant="outline">{status}</Badge>
}

function getTipoBadge(tipo: string | null) {
  if (!tipo) return <Badge variant="outline">-</Badge>

  if (tipo === 'BOLSISTA') {
    return <Badge className="bg-purple-500">Bolsista</Badge>
  }
  return (
    <Badge variant="outline" className="border-purple-500 text-purple-700">
      Voluntário
    </Badge>
  )
}

export function createRelatorioMonitorColumns(): ColumnDef<RelatorioMonitorAdminItem>[] {
  return [
    {
      header: 'Monitor',
      accessorKey: 'monitorNome',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.monitorNome}</div>
          <div className="text-sm text-muted-foreground">{row.original.monitorMatricula}</div>
        </div>
      ),
    },
    {
      header: 'Disciplina/Projeto',
      accessorKey: 'disciplinaNome',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
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
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ row }) => getTipoBadge(row.original.tipo),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) =>
        getStatusBadge(row.original.status, row.original.alunoAssinouEm, row.original.professorAssinouEm),
    },
    {
      header: 'Assinatura Aluno',
      accessorKey: 'alunoAssinouEm',
      cell: ({ row }) =>
        row.original.alunoAssinouEm ? new Date(row.original.alunoAssinouEm).toLocaleDateString('pt-BR') : '-',
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

export { getStatusBadge, getTipoBadge }
