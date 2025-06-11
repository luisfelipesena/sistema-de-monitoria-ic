'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/utils/api'
import { ColumnDef } from '@tanstack/react-table'
import { FileCheck, Award, Users, Download, Eye } from 'lucide-react'

type ResultadoListItem = {
  id: number
  projeto: {
    id: number
    titulo: string
    disciplinas: Array<{ codigo: string; nome: string }>
    professorResponsavelNome: string
  }
  tipoInscricao: 'BOLSISTA' | 'VOLUNTARIO'
  status: 'APROVADO' | 'REPROVADO' | 'EM_ANALISE' | 'LISTA_ESPERA'
  dataResultado?: Date
  posicaoLista?: number
  observacoes?: string
}

export default function ResultadosPage() {
  const { data: resultados, isLoading } = api.inscricao.getMyResults.useQuery()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <Badge variant="default" className="bg-green-500">Aprovado</Badge>
      case 'REPROVADO':
        return <Badge variant="destructive">Reprovado</Badge>
      case 'EM_ANALISE':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Em Análise</Badge>
      case 'LISTA_ESPERA':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Lista de Espera</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoInscricaoBadge = (tipo: string) => {
    switch (tipo) {
      case 'BOLSISTA':
        return <Award className="h-4 w-4 text-yellow-600" />
      case 'VOLUNTARIO':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const columns: ColumnDef<ResultadoListItem>[] = [
    {
      header: 'Projeto',
      accessorKey: 'projeto.titulo',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.projeto.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.projeto.disciplinas[0]?.codigo} - {row.original.projeto.professorResponsavelNome}
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'tipoInscricao',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {getTipoInscricaoBadge(row.original.tipoInscricao)}
          <span className="text-sm">{row.original.tipoInscricao === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div>
          {getStatusBadge(row.original.status)}
          {row.original.status === 'LISTA_ESPERA' && row.original.posicaoLista && (
            <div className="text-xs text-muted-foreground mt-1">
              Posição: {row.original.posicaoLista}º
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Data do Resultado',
      accessorKey: 'dataResultado',
      cell: ({ row }) => 
        row.original.dataResultado 
          ? new Date(row.original.dataResultado).toLocaleDateString('pt-BR')
          : '-'
      ,
    },
    {
      header: 'Ações',
      id: 'actions',
      cell: ({ row }) => {
        const resultado = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implementar visualização detalhada */}}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
            {resultado.status === 'APROVADO' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {/* Implementar download de documento */}}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar Documento
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // Separar resultados por status para estatísticas
  const stats = resultados?.reduce(
    (acc: any, resultado: any) => {
      switch (resultado.status) {
        case 'APROVADO':
          acc.aprovados++
          break
        case 'REPROVADO':
          acc.reprovados++
          break
        case 'EM_ANALISE':
          acc.emAnalise++
          break
        case 'LISTA_ESPERA':
          acc.listaEspera++
          break
      }
      return acc
    },
    { aprovados: 0, reprovados: 0, emAnalise: 0, listaEspera: 0 }
  ) || { aprovados: 0, reprovados: 0, emAnalise: 0, listaEspera: 0 }

  return (
    <PagesLayout 
      title="Resultados das Seleções" 
      subtitle="Acompanhe os resultados das suas inscrições em monitoria"
    >
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <FileCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.emAnalise}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lista de Espera</CardTitle>
            <FileCheck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.listaEspera}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
            <FileCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.reprovados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Meus Resultados
            {resultados && (
              <Badge variant="outline" className="ml-2">
                {resultados.length} inscrição(ões)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Carregando seus resultados...</p>
              </div>
            </div>
          ) : resultados && resultados.length > 0 ? (
            <TableComponent
              columns={columns}
              data={resultados}
              searchableColumn="projeto.titulo"
              searchPlaceholder="Buscar por projeto..."
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum resultado encontrado
              </h3>
              <p>
                Você ainda não se inscreveu em nenhum projeto de monitoria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  )
}