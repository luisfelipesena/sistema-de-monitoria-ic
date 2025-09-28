"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useConsolidatedMonitoringData, useExportConsolidated, useValidateCompleteData } from "@/hooks/use-relatorios"
import { useToast } from "@/hooks/use-toast"
import {
  SEMESTRE_ENUM,
  STATUS_MONITOR_ENUM,
  type Semestre,
  type StatusMonitor,
  type TipoVaga,
  getSemestreLabel,
  getStatusMonitorLabel,
  getTipoVagaLabel,
} from "@/types"
import { AlertTriangle, Award, Calendar, CheckCircle, Download, FileSpreadsheet, Filter, Mail, Users } from "lucide-react"
import { useState } from "react"

export default function ConsolidacaoPROGRADPage() {
  const { toast } = useToast()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<Semestre>("SEMESTRE_1")
  const [incluirBolsistas, setIncluirBolsistas] = useState(true)
  const [incluirVoluntarios, setIncluirVoluntarios] = useState(true)
  const [showValidation, setShowValidation] = useState(false)
  const [progradEmail, setProgradEmail] = useState("")
  const [showEmailDialog, setShowEmailDialog] = useState(false)

  const { data: consolidationData, isLoading, refetch } = useConsolidatedMonitoringData(selectedYear, selectedSemester)

  // Validar dados antes da exportação
  const { data: validationData, isLoading: loadingValidation } = useValidateCompleteData(
    selectedYear,
    selectedSemester,
    incluirBolsistas && incluirVoluntarios ? "ambos" : incluirBolsistas ? "bolsistas" : "voluntarios",
    showValidation
  )

  // Mutation para exportar consolidação final
  const exportConsolidatedMutation = useExportConsolidated()

  const handleSendEmail = async () => {
    if (!progradEmail || !progradEmail.includes('@')) {
      toast({
        title: "Email Inválido",
        description: "Por favor, insira um email válido da PROGRAD.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await exportConsolidatedMutation.mutateAsync({
        ano: selectedYear,
        semestre: selectedSemester,
        incluirBolsistas,
        incluirVoluntarios,
        progradEmail,
      })
      toast({
        title: "Email Enviado com Sucesso",
        description: result.message,
      })
      setShowEmailDialog(false)
      setProgradEmail("")
    } catch (error: any) {
      toast({
        title: "Erro no Envio",
        description: error.message || "Ocorreu um erro ao tentar enviar a planilha por email.",
        variant: "destructive",
      })
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year))
  }

  const handleSemesterChange = (semester: Semestre) => {
    setSelectedSemester(semester)
  }

  const handleValidateData = () => {
    setShowValidation(true)
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

    const csvData = (consolidationData || []).map((item) => [
      item.monitor.matricula,
      item.monitor.nome,
      item.monitor.email,
      item.monitor.cr.toFixed(2),
      getTipoVagaLabel(item.monitoria.tipo as TipoVaga),
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
    // Try to match with known status enum values
    const statusAsEnum = STATUS_MONITOR_ENUM.find((s) => s === status) as StatusMonitor | undefined
    if (statusAsEnum) {
      switch (statusAsEnum) {
        case "ATIVO":
          return <Badge className="bg-green-500">{getStatusMonitorLabel(statusAsEnum)}</Badge>
        case "CONCLUÍDO":
          return <Badge className="bg-blue-500">{getStatusMonitorLabel(statusAsEnum)}</Badge>
        case "CANCELADO":
          return <Badge variant="destructive">{getStatusMonitorLabel(statusAsEnum)}</Badge>
      }
    }
    // Fallback for unknown status values
    return <Badge variant="outline">{status}</Badge>
  }

  const getTipoIcon = (tipo: TipoVaga) => {
    return tipo === "BOLSISTA" ? (
      <Award className="h-4 w-4 text-yellow-600" />
    ) : (
      <Users className="h-4 w-4 text-blue-600" />
    )
  }

  const data = consolidationData || []
  const monitoresBolsistas = data.filter((item) => item.monitoria.tipo === "BOLSISTA")
  const monitoresVoluntarios = data.filter((item) => item.monitoria.tipo === "VOLUNTARIO")
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
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
                  {SEMESTRE_ENUM.map((semestre) => (
                    <SelectItem key={semestre} value={semestre}>
                      {getSemestreLabel(semestre)}
                    </SelectItem>
                  ))}
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
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{data.length}</div>
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
              <h4 className="font-medium">Envio por Email (Excel)</h4>
              <p className="text-sm text-muted-foreground">
                Envie a planilha oficial diretamente para a PROGRAD via email com validação completa de dados
              </p>
              <div className="flex gap-2">
                <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!data || data.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Planilha PROGRAD</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email da PROGRAD</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="exemplo@prograd.ufba.br"
                          value={progradEmail}
                          onChange={(e) => setProgradEmail(e.target.value)}
                        />
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Informações que serão enviadas:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Período: {selectedYear}.{selectedSemester === "SEMESTRE_1" ? "1" : "2"}</li>
                          <li>• Total de monitores: {data?.length || 0}</li>
                          <li>• Incluir bolsistas: {incluirBolsistas ? "Sim" : "Não"}</li>
                          <li>• Incluir voluntários: {incluirVoluntarios ? "Sim" : "Não"}</li>
                          <li>• Formato: Excel (.xlsx)</li>
                        </ul>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSendEmail}
                          disabled={exportConsolidatedMutation.isPending || !progradEmail}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {exportConsolidatedMutation.isPending ? "Enviando..." : "Enviar Email"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Exportação CSV (Rápida) */}
            <div className="space-y-2">
              <h4 className="font-medium">Exportação Rápida (CSV)</h4>
              <p className="text-sm text-muted-foreground">Formato CSV para análise rápida ou backup dos dados</p>
              <Button
                onClick={generateCSVSpreadsheet}
                disabled={isLoading || !data || data.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar CSV
              </Button>
            </div>
          </div>

          {data && data.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Nenhum monitor encontrado para o período selecionado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Monitores */}
      {data && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Monitores do Período {selectedYear}.{selectedSemester === "SEMESTRE_1" ? "1" : "2"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{data.length} monitor(es) encontrado(s)</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTipoIcon(item.monitoria.tipo as TipoVaga)}
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
                            {getTipoVagaLabel(item.monitoria.tipo as TipoVaga)}
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
