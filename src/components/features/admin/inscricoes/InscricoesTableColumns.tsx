import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { getStatusInscricaoLabel, type StatusInscricao } from '@/types'

type InscricaoAdminItem = {
  id: number
  projetoId: number
  tipoVagaPretendida: string | null
  status: string | null
  notaDisciplina: string | null
  notaSelecao: string | null
  notaFinal: string | null
  createdAt: Date | null
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
  }
  professorResponsavel: {
    nomeCompleto: string
  }
  departamento: {
    sigla: string | null
    nome: string
  }
  aluno: {
    nomeCompleto: string
    matricula: string | null
  }
}

function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">-</Badge>

  const statusTyped = status as StatusInscricao

  if (status === 'SUBMITTED') {
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-700">
        Aguardando
      </Badge>
    )
  }
  if (status.startsWith('SELECTED_')) {
    return (
      <Badge variant="outline" className="border-green-500 text-green-700">
        {getStatusInscricaoLabel(statusTyped)}
      </Badge>
    )
  }
  if (status.startsWith('ACCEPTED_')) {
    return <Badge className="bg-green-500">{getStatusInscricaoLabel(statusTyped)}</Badge>
  }
  if (status.startsWith('REJECTED_')) {
    return <Badge variant="destructive">{getStatusInscricaoLabel(statusTyped)}</Badge>
  }

  return <Badge variant="outline">{getStatusInscricaoLabel(statusTyped)}</Badge>
}

function getTipoBadge(tipo: string | null) {
  if (!tipo) return <Badge variant="outline">-</Badge>

  if (tipo === 'BOLSISTA') {
    return <Badge className="bg-purple-500">Bolsista</Badge>
  }
  if (tipo === 'VOLUNTARIO') {
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-700">
        Voluntário
      </Badge>
    )
  }
  return <Badge variant="secondary">Qualquer</Badge>
}

export function createInscricoesColumns(): ColumnDef<InscricaoAdminItem>[] {
  return [
    {
      header: 'Aluno',
      accessorKey: 'aluno.nomeCompleto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.aluno.matricula}</div>
        </div>
      ),
    },
    {
      header: 'Projeto',
      accessorKey: 'projeto.titulo',
      cell: ({ row }) => (
        <div className="max-w-[250px]">
          <div className="font-medium truncate">{row.original.projeto.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.projeto.ano}/{row.original.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}
          </div>
        </div>
      ),
    },
    {
      header: 'Professor',
      accessorKey: 'professorResponsavel.nomeCompleto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professorResponsavel.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento.sigla || row.original.departamento.nome}</div>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipoVagaPretendida',
      cell: ({ row }) => getTipoBadge(row.original.tipoVagaPretendida),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Notas',
      accessorKey: 'notaFinal',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.notaFinal ? (
            <>
              <div className="font-medium">{Number(row.original.notaFinal).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                D: {row.original.notaDisciplina ? Number(row.original.notaDisciplina).toFixed(1) : '-'} | S:{' '}
                {row.original.notaSelecao ? Number(row.original.notaSelecao).toFixed(1) : '-'}
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Data Inscrição',
      accessorKey: 'createdAt',
      cell: ({ row }) =>
        row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('pt-BR') : '-',
    },
  ]
}

export { getStatusBadge, getTipoBadge }
