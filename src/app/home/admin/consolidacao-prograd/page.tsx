"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/utils/api"
import { AlertTriangle, Award, Calendar, CheckCircle, Download, FileSpreadsheet, Filter, Users } from "lucide-react"
import { useEffect, useState } from "react"

type ConsolidationData = {
  id: number
  monitor: {
    nome: string
    matricula: string
    email: string
    cr: number
    banco?: string
    agencia?: string
    conta?: string
    digitoConta?: string
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
    tipo: "BOLSISTA" | "VOLUNTARIO"
    dataInicio: string
    dataFim: string
    valorBolsa?: number
    status: string
  }
}

export default function ConsolidacaoPROGRADPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<"SEMESTRE_1" | "SEMESTRE_2">("SEMESTRE_1")
  const [incluirBolsistas, setIncluirBolsistas] = useState(true)
  const [incluirVoluntarios, setIncluirVoluntarios] = useState(true)
  const [showValidation, setShowValidation] = useState(false)

  // Buscar dados consolidados de monitoria
  const [consolidationData, setConsolidationData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const getConsolidatedMutation = api.relatorios.getConsolidatedMonitoringData.useMutation({
    onSuccess: (data) => {
      setConsolidationData(data)
      setIsLoading(false)
    },
    onError: () => {
      setIsLoading(false)
    },
  })

  const refetch = () => {
    setIsLoading(true)
    getConsolidatedMutation.mutate({ ano: selectedYear, semestre: selectedSemester })
  }

  // Fetch data when component mounts or parameters change
  useEffect(() => {
    setIsLoading(true)
    getConsolidatedMutation.mutate({ ano: selectedYear, semestre: selectedSemester })
  }, [selectedYear, selectedSemester, getConsolidatedMutation])

  // Buscar dados de bolsistas para validação
  const { data: bolsistasData, isLoading: loadingBolsistas } = api.relatorios.monitoresFinalBolsistas.useQuery(
    { ano: selectedYear, semestre: selectedSemester },
    { enabled: incluirBolsistas }
  )

  // Buscar dados de voluntários para validação
  const { data: voluntariosData, isLoading: loadingVoluntarios } = api.relatorios.monitoresFinalVoluntarios.useQuery(
    { ano: selectedYear, semestre: selectedSemester },
    { enabled: incluirVoluntarios }
  )

  // Validar dados antes da exportação
  const { data: validationData, isLoading: loadingValidation } = api.relatorios.validateCompleteData.useQuery(
    {
      ano: selectedYear,
      semestre: selectedSemester,
      tipo: incluirBolsistas && incluirVoluntarios ? "ambos" : incluirBolsistas ? "bolsistas" : "voluntarios",
    },
    { enabled: showValidation }
  )

  // Mutation para exportar consolidação final
  const exportConsolidatedMutation = api.relatorios.exportConsolidated.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Exportação Iniciada",
        description: `${data.message} O arquivo ${data.fileName} será gerado.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro na Exportação",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year))
  }

  const handleSemesterChange = (semester: "SEMESTRE_1" | "SEMESTRE_2") => {
    setSelectedSemester(semester)
  }

  const handleValidateData = () => {
    setShowValidation(true)
  }

  const generateExcelSpreadsheet = async () => {
    await exportConsolidatedMutation.mutateAsync({
      ano: selectedYear,
      semestre: selectedSemester,
      incluirBolsistas,
      incluirVoluntarios,
    })
  }

  const generateCSVSpreadsheet = () => {
    if (!consolidationData || consolidationData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para gerar a planilha.",
        variant: "destructive",
      })
      return
    }

    // Preparar dados para CSV
    const csvHeader = [
      "Matrícula Monitor",
      "Nome Monitor",
      "Email Monitor",
      "CR",
      "Tipo Monitoria",
      "Valor Bolsa",
      "Projeto",
      "Disciplinas",
      "Professor Responsável",
      "SIAPE Professor",
      "Departamento",
      "Carga Horária Semanal",
      "Total Horas",
      "Data Início",
      "Data Fim",
      "Status",
      "Período",
      "Banco",
      "Agência",
      "Conta",
      "Dígito",
    ]

    const csvData = consolidationData.map((item) => [
      item.monitor.matricula,
      item.monitor.nome,
      item.monitor.email,
      item.monitor.cr.toFixed(2),
      item.monitoria.tipo === "BOLSISTA" ? "Bolsista" : "Voluntário",
      item.monitoria.valorBolsa ? `R$ ${item.monitoria.valorBolsa.toFixed(2)}` : "N/A",
      item.projeto.titulo,
      item.projeto.disciplinas,
      item.professor.nome,
      item.professor.matriculaSiape || "N/A",
      item.professor.departamento,
      item.projeto.cargaHorariaSemana,
      item.projeto.cargaHorariaSemana * item.projeto.numeroSemanas,
      item.monitoria.dataInicio,
      item.monitoria.dataFim,
      item.monitoria.status,
      `${item.projeto.ano}.${item.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}`,
      item.monitor.banco || "N/A",
      item.monitor.agencia || "N/A",
      item.monitor.conta || "N/A",
      item.monitor.digitoConta || "N/A",
    ])

    // Criar CSV
    const csvContent = [csvHeader, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Download do arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `consolidacao-monitoria-${selectedYear}-${selectedSemester === "SEMESTRE_1" ? "1" : "2"}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Sucesso",
      description: "Planilha CSV gerada e baixada com sucesso!",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return <Badge className="bg-green-500">Ativo</Badge>
      case "CONCLUÍDO":
        return <Badge className="bg-blue-500">Concluído</Badge>
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === "BOLSISTA" ? (
      <Award className="h-4 w-4 text-yellow-600" />
    ) : (
      <Users className="h-4 w-4 text-blue-600" />
    )
  }

  const monitoresBolsistas = consolidationData?.filter((item) => item.monitoria.tipo === "BOLSISTA") || []
  const monitoresVoluntarios = consolidationData?.filter((item) => item.monitoria.tipo === "VOLUNTARIO") || []
  const totalBolsas = monitoresBolsistas.reduce((sum, item) => sum + (item.monitoria.valorBolsa || 0), 0)

  return (
    <PagesLayout title="Consolidação PROGRAD" subtitle="Relatório consolidado de monitoria para envio à PROGRAD">
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
            <div className="space-y-2">
              <Label>Incluir na Exportação</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bolsistas"
                    checked={incluirBolsistas}
                    onCheckedChange={(checked) => setIncluirBolsistas(Boolean(checked))}
                  />
                  <Label htmlFor="bolsistas">Bolsistas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="voluntarios"
                    checked={incluirVoluntarios}
                    onCheckedChange={(checked) => setIncluirVoluntarios(Boolean(checked))}
                  />
                  <Label htmlFor="voluntarios">Voluntários</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
            <Button onClick={handleValidateData} disabled={loadingValidation} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Validar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validação dos Dados */}
      {showValidation && validationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationData.valido ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Validação dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationData.valido ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Todos os dados estão completos e prontos para exportação!</AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validationData.totalProblemas} problema(s) encontrado(s). Corrija antes de exportar.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationData.problemas.map((problema, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-red-50">
                      <div className="font-medium">
                        {problema.nomeAluno} ({problema.tipo})
                      </div>
                      <div className="text-sm text-muted-foreground">Problemas: {problema.problemas.join(", ")}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Botões de Geração */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório PROGRAD</CardTitle>
          <p className="text-sm text-muted-foreground">
            Baixe a planilha consolidada com todos os dados de monitoria do período selecionado
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exportação Excel (PROGRAD) */}
            <div className="space-y-2">
              <h4 className="font-medium">Exportação Oficial (Excel)</h4>
              <p className="text-sm text-muted-foreground">
                Formato oficial para envio à PROGRAD com validação completa de dados
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => generateExcelSpreadsheet()}
                  disabled={
                    exportConsolidatedMutation.isPending || !consolidationData || consolidationData.length === 0
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {exportConsolidatedMutation.isPending ? "Gerando..." : "Baixar Excel Oficial"}
                </Button>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Exportação CSV (Rápida) */}
            <div className="space-y-2">
              <h4 className="font-medium">Exportação Rápida (CSV)</h4>
              <p className="text-sm text-muted-foreground">Formato CSV para análise rápida ou backup dos dados</p>
              <Button
                onClick={generateCSVSpreadsheet}
                disabled={isLoading || !consolidationData || consolidationData.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar CSV
              </Button>
            </div>
          </div>

          {consolidationData && consolidationData.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Nenhum monitor encontrado para o período selecionado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Monitores */}
      {consolidationData && consolidationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Monitores do Período {selectedYear}.{selectedSemester === "SEMESTRE_1" ? "1" : "2"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{consolidationData.length} monitor(es) encontrado(s)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consolidationData.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
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
                          {item.monitoria.valorBolsa && <p>Valor Bolsa: R$ {item.monitoria.valorBolsa.toFixed(2)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={item.monitoria.tipo === "BOLSISTA" ? "bg-yellow-500" : "bg-blue-500"}>
                            {item.monitoria.tipo === "BOLSISTA" ? "Bolsista" : "Voluntário"}
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
    </PagesLayout>
  )
}
