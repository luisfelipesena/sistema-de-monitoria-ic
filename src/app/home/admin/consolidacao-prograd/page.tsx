'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { FileSpreadsheet, Download, Filter, Users, Award, Calendar } from 'lucide-react'

type ConsolidationData = {
  id: number
  monitor: {
    nome: string
    matricula: string
    email: string
    cr: number
  }
  professor: {
    nome: string
    matriculaSiape?: string
    email: string
    departamento: string
  }
  projeto: {
    titulo: string
    disciplinas: string
    ano: number
    semestre: string
    cargaHorariaSemana: number
    numeroSemanas: number
  }
  monitoria: {
    tipo: 'BOLSISTA' | 'VOLUNTARIO'
    dataInicio: string
    dataFim: string
    valorBolsa?: number
    status: string
  }
}

export default function ConsolidacaoPROGRADPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<'SEMESTRE_1' | 'SEMESTRE_2'>('SEMESTRE_1')

  // Buscar dados consolidados de monitoria
  const { data: consolidationData, isLoading, refetch } = api.relatorios.getConsolidatedMonitoringData.useQuery(
    { ano: selectedYear, semestre: selectedSemester },
    { enabled: true }
  )

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year))
  }

  const handleSemesterChange = (semester: 'SEMESTRE_1' | 'SEMESTRE_2') => {
    setSelectedSemester(semester)
  }

  const generateSpreadsheet = () => {
    if (!consolidationData || consolidationData.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para gerar a planilha.',
        variant: 'destructive',
      })
      return
    }

    // Preparar dados para CSV
    const csvHeader = [
      'Matrícula Monitor',
      'Nome Monitor',
      'Email Monitor',
      'CR',
      'Tipo Monitoria',
      'Valor Bolsa',
      'Projeto',
      'Disciplinas',
      'Professor Responsável',
      'SIAPE Professor',
      'Departamento',
      'Carga Horária Semanal',
      'Total Horas',
      'Data Início',
      'Data Fim',
      'Status',
      'Período'
    ]

    const csvData = consolidationData.map(item => [
      item.monitor.matricula,
      item.monitor.nome,
      item.monitor.email,
      item.monitor.cr.toFixed(2),
      item.monitoria.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntário',
      item.monitoria.valorBolsa ? `R$ ${item.monitoria.valorBolsa.toFixed(2)}` : 'N/A',
      item.projeto.titulo,
      item.projeto.disciplinas,
      item.professor.nome,
      item.professor.matriculaSiape || 'N/A',
      item.professor.departamento,
      item.projeto.cargaHorariaSemana,
      item.projeto.cargaHorariaSemana * item.projeto.numeroSemanas,
      item.monitoria.dataInicio,
      item.monitoria.dataFim,
      item.monitoria.status,
      `${item.projeto.ano}.${item.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}`
    ])

    // Criar CSV
    const csvContent = [csvHeader, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `consolidacao-monitoria-${selectedYear}-${selectedSemester === 'SEMESTRE_1' ? '1' : '2'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Sucesso',
      description: 'Planilha gerada e baixada com sucesso!',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-green-500">Ativo</Badge>
      case 'CONCLUÍDO':
        return <Badge className="bg-blue-500">Concluído</Badge>
      case 'CANCELADO':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'BOLSISTA' ? (
      <Award className="h-4 w-4 text-yellow-600" />
    ) : (
      <Users className="h-4 w-4 text-blue-600" />
    )
  }

  const monitoresBolsistas = consolidationData?.filter(item => item.monitoria.tipo === 'BOLSISTA') || []
  const monitoresVoluntarios = consolidationData?.filter(item => item.monitoria.tipo === 'VOLUNTARIO') || []
  const totalBolsas = monitoresBolsistas.reduce((sum, item) => sum + (item.monitoria.valorBolsa || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consolidação PROGRAD</h1>
        <p className="text-muted-foreground">
          Relatório consolidado de monitoria para envio à PROGRAD
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Select value={selectedSemester} onValueChange={handleSemesterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                  <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} disabled={isLoading}>
                <Calendar className="h-4 w-4 mr-2" />
                Atualizar Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {consolidationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{consolidationData.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Monitores</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{monitoresBolsistas.length}</div>
                  <div className="text-sm text-muted-foreground">Bolsistas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{monitoresVoluntarios.length}</div>
                  <div className="text-sm text-muted-foreground">Voluntários</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">R$ {totalBolsas.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total em Bolsas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão de Geração */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório PROGRAD</CardTitle>
          <p className="text-sm text-muted-foreground">
            Baixe a planilha consolidada com todos os dados de monitoria do período selecionado
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateSpreadsheet} 
            disabled={isLoading || !consolidationData || consolidationData.length === 0}
            className="w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Planilha Consolidada (.CSV)
          </Button>
          {consolidationData && consolidationData.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Nenhum monitor encontrado para o período selecionado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Monitores */}
      {consolidationData && consolidationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monitores do Período {selectedYear}.{selectedSemester === 'SEMESTRE_1' ? '1' : '2'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {consolidationData.length} monitor(es) encontrado(s)
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consolidationData.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTipoIcon(item.monitoria.tipo)}
                          <h3 className="font-semibold text-lg">{item.monitor.nome}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
                          <p>Matrícula: {item.monitor.matricula}</p>
                          <p>CR: {item.monitor.cr.toFixed(2)}</p>
                          <p>E-mail: {item.monitor.email}</p>
                          <p>Professor: {item.professor.nome}</p>
                          <p>Projeto: {item.projeto.titulo}</p>
                          <p>Disciplinas: {item.projeto.disciplinas}</p>
                          <p>Carga Horária: {item.projeto.cargaHorariaSemana}h/semana</p>
                          {item.monitoria.valorBolsa && (
                            <p>Valor Bolsa: R$ {item.monitoria.valorBolsa.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={item.monitoria.tipo === 'BOLSISTA' ? 'bg-yellow-500' : 'bg-blue-500'}>
                            {item.monitoria.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'}
                          </Badge>
                          {getStatusBadge(item.monitoria.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}