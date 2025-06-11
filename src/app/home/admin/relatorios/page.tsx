'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/utils/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Users, 
  BookOpen, 
  FileText, 
  Award,
  Building,
  GraduationCap,
  Mail,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const filtersSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
})

type FiltersData = z.infer<typeof filtersSchema>

export default function RelatoriosPage() {
  const [filters, setFilters] = useState<FiltersData>({
    ano: new Date().getFullYear(),
    semestre: 'SEMESTRE_1',
  })

  const form = useForm<FiltersData>({
    resolver: zodResolver(filtersSchema),
    defaultValues: filters,
  })

  const { data: relatorioGeral, isLoading: loadingGeral } = api.relatorios.getRelatorioGeral.useQuery(filters)
  const { data: departamentos, isLoading: loadingDepartamentos } = api.relatorios.getRelatorioPorDepartamento.useQuery(filters)
  const { data: professores, isLoading: loadingProfessores } = api.relatorios.getRelatorioProfessores.useQuery(filters)
  const { data: alunos, isLoading: loadingAlunos } = api.relatorios.getRelatorioAlunos.useQuery(filters)
  const { data: disciplinas, isLoading: loadingDisciplinas } = api.relatorios.getRelatorioDisciplinas.useQuery(filters)
  const { data: editais, isLoading: loadingEditais } = api.relatorios.getRelatorioEditais.useQuery({ ano: filters.ano })

  const exportCsvMutation = api.relatorios.exportRelatorioCsv.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      // In a real implementation, trigger file download
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const handleFiltersSubmit = (data: FiltersData) => {
    setFilters(data)
  }

  const handleExport = (tipo: string) => {
    exportCsvMutation.mutate({
      tipo: tipo as any,
      ano: filters.ano,
      semestre: filters.semestre,
    })
  }

  // Column definitions for different reports
  const departamentosColumns: ColumnDef<any>[] = [
    {
      header: 'Departamento',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.departamento.sigla}</div>
          <div className="text-sm text-muted-foreground">{row.original.departamento.nome}</div>
        </div>
      ),
    },
    {
      header: 'Projetos',
      accessorKey: 'projetos',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.original.projetos}</span>
          <span className="text-sm text-muted-foreground">({row.original.projetosAprovados} aprovados)</span>
        </div>
      ),
    },
    {
      header: 'Bolsas',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.bolsasDisponibilizadas} disponibilizadas</div>
          <div className="text-sm text-muted-foreground">{row.original.bolsasSolicitadas} solicitadas</div>
        </div>
      ),
    },
  ]

  const professoresColumns: ColumnDef<any>[] = [
    {
      header: 'Professor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.professor.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.professor.emailInstitucional}</div>
          <div className="text-xs text-muted-foreground">{row.original.departamento.sigla}</div>
        </div>
      ),
    },
    {
      header: 'Projetos',
      accessorKey: 'projetos',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.projetos}</div>
          <div className="text-sm text-muted-foreground">({row.original.projetosAprovados} aprovados)</div>
        </div>
      ),
    },
    {
      header: 'Bolsas',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.bolsasDisponibilizadas}</div>
          <div className="text-sm text-muted-foreground">de {row.original.bolsasSolicitadas}</div>
        </div>
      ),
    },
  ]

  const alunosColumns: ColumnDef<any>[] = [
    {
      header: 'Aluno',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.aluno.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">Mat: {row.original.aluno.matricula}</div>
          <div className="text-sm text-muted-foreground">CR: {row.original.aluno.cr}</div>
        </div>
      ),
    },
    {
      header: 'Projeto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium truncate max-w-xs">{row.original.projeto.titulo}</div>
          <div className="text-sm text-muted-foreground">{row.original.projeto.professorResponsavel}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.statusInscricao
        const getStatusBadge = () => {
          switch (status) {
            case 'SUBMITTED':
              return <Badge variant="outline" className="border-blue-500 text-blue-700">Submetida</Badge>
            case 'SELECTED_BOLSISTA':
              return <Badge variant="default" className="bg-green-500">Selecionado (Bolsista)</Badge>
            case 'SELECTED_VOLUNTARIO':
              return <Badge variant="outline" className="border-green-500 text-green-700">Selecionado (Voluntário)</Badge>
            case 'ACCEPTED_BOLSISTA':
              return <Badge variant="default" className="bg-green-600">Aceito (Bolsista)</Badge>
            case 'ACCEPTED_VOLUNTARIO':
              return <Badge variant="outline" className="border-green-600 text-green-700">Aceito (Voluntário)</Badge>
            default:
              return <Badge variant="outline">{status}</Badge>
          }
        }
        return getStatusBadge()
      },
    },
    {
      header: 'Tipo Pretendido',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipoVagaPretendida === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'}
        </Badge>
      ),
    },
  ]

  const disciplinasColumns: ColumnDef<any>[] = [
    {
      header: 'Disciplina',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.disciplina.codigo}</div>
          <div className="text-sm text-muted-foreground">{row.original.disciplina.nome}</div>
          <div className="text-xs text-muted-foreground">{row.original.departamento.sigla}</div>
        </div>
      ),
    },
    {
      header: 'Projetos',
      accessorKey: 'projetos',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.projetos}</div>
          <div className="text-sm text-muted-foreground">({row.original.projetosAprovados} aprovados)</div>
        </div>
      ),
    },
  ]

  const editaisColumns: ColumnDef<any>[] = [
    {
      header: 'Edital',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.edital.numeroEdital}</div>
          <div className="text-sm text-muted-foreground">{row.original.edital.titulo}</div>
        </div>
      ),
    },
    {
      header: 'Período',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.periodo.ano}/{row.original.periodo.semestre === 'SEMESTRE_1' ? '1' : '2'}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.periodo.dataInicio).toLocaleDateString('pt-BR')} - 
            {new Date(row.original.periodo.dataFim).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        row.original.edital.publicado ? (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publicado
          </Badge>
        ) : (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        )
      ),
    },
    {
      header: 'Data de Publicação',
      cell: ({ row }) => 
        row.original.edital.dataPublicacao 
          ? new Date(row.original.edital.dataPublicacao).toLocaleDateString('pt-BR')
          : '-'
    },
    {
      header: 'Criado por',
      accessorKey: 'criadoPor.username',
    },
  ]

  return (
    <PagesLayout 
      title="Relatórios PROGRAD" 
      subtitle="Relatórios administrativos e estatísticas do sistema de monitoria"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFiltersSubmit)} className="flex gap-4 items-end">
                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          className="w-32"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semestre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                          <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Filtrar</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {relatorioGeral && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Projetos</p>
                    <p className="text-2xl font-semibold">{relatorioGeral.projetos.aprovados}/{relatorioGeral.projetos.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bolsas</p>
                    <p className="text-2xl font-semibold">
                      {relatorioGeral.projetos.totalBolsasDisponibilizadas}/{relatorioGeral.projetos.totalBolsasSolicitadas}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Inscrições</p>
                    <p className="text-2xl font-semibold">{relatorioGeral.inscricoes.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vagas Preenchidas</p>
                    <p className="text-2xl font-semibold">{relatorioGeral.vagas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tabs */}
        <Tabs defaultValue="departamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
            <TabsTrigger value="professores">Professores</TabsTrigger>
            <TabsTrigger value="alunos">Alunos</TabsTrigger>
            <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
            <TabsTrigger value="editais">Editais</TabsTrigger>
          </TabsList>

          <TabsContent value="departamentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Relatório por Departamentos
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('departamentos')}
                    disabled={exportCsvMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDepartamentos ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : departamentos && departamentos.length > 0 ? (
                  <TableComponent
                    columns={departamentosColumns}
                    data={departamentos}
                    searchableColumn="departamento.sigla"
                    searchPlaceholder="Buscar departamento..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Relatório de Professores
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('professores')}
                    disabled={exportCsvMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProfessores ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : professores && professores.length > 0 ? (
                  <TableComponent
                    columns={professoresColumns}
                    data={professores}
                    searchableColumn="professor.nomeCompleto"
                    searchPlaceholder="Buscar professor..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alunos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Relatório de Alunos
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('alunos')}
                    disabled={exportCsvMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAlunos ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : alunos && alunos.length > 0 ? (
                  <TableComponent
                    columns={alunosColumns}
                    data={alunos}
                    searchableColumn="aluno.nomeCompleto"
                    searchPlaceholder="Buscar aluno..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disciplinas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Relatório de Disciplinas
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('disciplinas')}
                    disabled={exportCsvMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDisciplinas ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : disciplinas && disciplinas.length > 0 ? (
                  <TableComponent
                    columns={disciplinasColumns}
                    data={disciplinas}
                    searchableColumn="disciplina.codigo"
                    searchPlaceholder="Buscar disciplina..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editais">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Relatório de Editais
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('editais')}
                    disabled={exportCsvMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEditais ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : editais && editais.length > 0 ? (
                  <TableComponent
                    columns={editaisColumns}
                    data={editais}
                    searchableColumn="edital.numeroEdital"
                    searchPlaceholder="Buscar edital..."
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum edital encontrado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PagesLayout>
  )
}