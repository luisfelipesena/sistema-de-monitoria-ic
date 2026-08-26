"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AtaSelecaoTemplate } from "@/server/lib/pdfTemplates/AtaSelecaoTemplate"
import { ResultadoSelecaoTemplate } from "@/server/lib/pdfTemplates/resultado-selecao"
import {
  AtaSelecaoData,
  PROJETO_STATUS_APPROVED,
  Semestre,
  SelecaoCandidato,
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
  STATUS_INSCRICAO_REJECTED_BY_PROFESSOR,
  STATUS_INSCRICAO_WAITING_LIST,
  getSemestreNumero,
} from "@/types"
import { api } from "@/utils/api"
import { Award, Eye, FileText, Filter, Loader2, Save, Send, Users } from "lucide-react"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"

// PDFViewer wrapper to prevent SSR issues - separate file for ESM compatibility
const ClientOnlyPDFViewer = dynamic(
  () => import("@/components/features/projects/PDFViewerWrapper").then((mod) => mod.PDFViewerWrapper),
  { ssr: false, loading: () => <div className="flex justify-center items-center h-[800px]"><Loader2 className="h-8 w-8 animate-spin" /></div> }
)

export default function AtasSelecaoPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedAtaType, setSelectedAtaType] = useState<"BOLSISTA" | "VOLUNTARIO">("BOLSISTA")
  const [pdfMode, setPdfMode] = useState<"ATA" | "RESULTADO">("ATA")
  const [showPDF, setShowPDF] = useState(false)
  const [ataData, setAtaData] = useState<AtaSelecaoData | null>(null)
  const [selectedAno, setSelectedAno] = useState<string>("TODOS")
  const [selectedSemestre, setSelectedSemestre] = useState<string>("TODOS")
  const [notifyStudents, setNotifyStudents] = useState(true)

  const [ataInfo, setAtaInfo] = useState({
    dataSelecao: new Date().toLocaleDateString("pt-BR"),
    localSelecao: "",
    observacoes: "",
  })

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Anos únicos disponíveis nos projetos
  const anosDisponiveis = useMemo(() => {
    if (!projetos) return []
    const setAnos = new Set(projetos.map((p) => p.ano))
    return Array.from(setAnos).sort((a, b) => b - a)
  }, [projetos])

  // Filtragem dos projetos elegíveis por Ano e Semestre
  const projetosElegiveis = useMemo(() => {
    if (!projetos) return []
    return projetos
      .filter((p) => {
        const isApproved = p.status === PROJETO_STATUS_APPROVED
        const matchAno = selectedAno === "TODOS" || p.ano === parseInt(selectedAno)
        const matchSemestre = selectedSemestre === "TODOS" || p.semestre === selectedSemestre
        return isApproved && matchAno && matchSemestre
      })
      .sort((a, b) => {
        if (b.ano !== a.ano) return b.ano - a.ano
        const semA = Number(getSemestreNumero(a.semestre as Semestre) ?? 0)
        const semB = Number(getSemestreNumero(b.semestre as Semestre) ?? 0)
        if (semB !== semA) return semB - semA
        return b.id - a.id
      })
  }, [projetos, selectedAno, selectedSemestre])

  // Buscar dados da ata quando projeto for selecionado
  const { data: dadosAta, isLoading: loadingAta } = api.selecao.generateAtaData.useQuery(
    { projetoId: selectedProjectId?.toString() || "" },
    { enabled: !!selectedProjectId }
  )

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(parseInt(projectId))
    setShowPDF(false)
  }

  const prepareAtaData = (tipoAta: "BOLSISTA" | "VOLUNTARIO"): AtaSelecaoData | null => {
    if (!dadosAta) return null

    return {
      tipoAta: tipoAta,
      projeto: {
        id: dadosAta.projeto.id,
        titulo: dadosAta.projeto.titulo,
        ano: dadosAta.projeto.ano,
        semestre: dadosAta.projeto.semestre,
        departamento: dadosAta.projeto.departamento || { nome: 'N/A', sigla: null },
        professorResponsavel: dadosAta.projeto.professorResponsavel,
        disciplinas: dadosAta.projeto.disciplinas,
      },
      totalInscritos: dadosAta.totalInscritos,
      totalCompareceram: dadosAta.totalCompareceram,
      inscricoesBolsista: dadosAta.inscricoesBolsista,
      inscricoesVoluntario: dadosAta.inscricoesVoluntario,
      dataGeracao: dadosAta.dataGeracao,
      candidatos: [...dadosAta.inscricoesBolsista, ...dadosAta.inscricoesVoluntario].map((c: SelecaoCandidato) => ({
        id: c.id,
        aluno: c.aluno,
        tipoVagaPretendida: c.tipoVagaPretendida,
        notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
        notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
        coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
        notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
        status: c.status,
        observacoes: c.feedbackProfessor,
      })),
      ataInfo: {
        dataSelecao: ataInfo.dataSelecao || new Date().toLocaleDateString("pt-BR"),
        localSelecao: ataInfo.localSelecao || "Online via Sistema de Monitoria",
        observacoes: ataInfo.observacoes || "O processo seletivo ocorreu de forma remota, com base nas notas e CR dos candidatos.",
      },
    }
  }

  const handleGenerateAtaPDF = (tipoAta: "BOLSISTA" | "VOLUNTARIO") => {
    const dataForPDF = prepareAtaData(tipoAta)
    if (!dataForPDF) return

    setSelectedAtaType(tipoAta)
    setPdfMode("ATA")
    setAtaData(dataForPDF)
    setShowPDF(true)
  }

  const handleGenerateResultadoPDF = (tipoResultado: "BOLSISTA" | "VOLUNTARIO") => {
    const dataForPDF = prepareAtaData(tipoResultado)
    if (!dataForPDF) return

    setSelectedAtaType(tipoResultado)
    setPdfMode("RESULTADO")
    setAtaData(dataForPDF)
    setShowPDF(true)
  }

  // Mutation para salvar ata
  const saveAtaMutation = api.selecao.publishResults.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ata salva com sucesso!",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSaveAta = () => {
    if (!selectedProjectId) return

    saveAtaMutation.mutate({
      projetoId: selectedProjectId.toString(),
      notifyStudents: false,
      mensagemPersonalizada: ataInfo.observacoes,
    })
  }

  // Mutation para publicar resultados e notificar alunos
  const publishResultsMutation = api.selecao.publishResults.useMutation({
    onSuccess: () => {
      toast({
        title: "Resultados Publicados!",
        description: "Os resultados foram publicados com sucesso e as notificações foram enviadas aos alunos selecionados.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao publicar resultados",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handlePublishResults = () => {
    if (!selectedProjectId) return

    publishResultsMutation.mutate({
      projetoId: selectedProjectId.toString(),
      notifyStudents,
      mensagemPersonalizada: ataInfo.observacoes || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Atas e Resultados</h1>
        <p className="text-muted-foreground">Gere e gerencie atas de seleção e documentos de resultado dos seus projetos</p>
      </div>

      {/* Seleção de Projeto com Filtros de Ano e Semestre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Projeto
          </CardTitle>
          <CardDescription>Filtre por ano e semestre para consultar projetos atuais ou anteriores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros de Ano e Semestre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="filtroAno" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <Filter className="h-3.5 w-3.5" />
                Ano Letivo
              </Label>
              <Select value={selectedAno} onValueChange={(val) => { setSelectedAno(val); setSelectedProjectId(null); setShowPDF(false); }} disabled={loadingProjetos}>
                <SelectTrigger id="filtroAno" className="bg-background">
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Anos</SelectItem>
                  {anosDisponiveis.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroSemestre" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <Filter className="h-3.5 w-3.5" />
                Semestre
              </Label>
              <Select value={selectedSemestre} onValueChange={(val) => { setSelectedSemestre(val); setSelectedProjectId(null); setShowPDF(false); }} disabled={loadingProjetos}>
                <SelectTrigger id="filtroSemestre" className="bg-background">
                  <SelectValue placeholder="Todos os semestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Semestres</SelectItem>
                  <SelectItem value="SEMESTRE_1">Semestre 1 (.1)</SelectItem>
                  <SelectItem value="SEMESTRE_2">Semestre 2 (.2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projeto">Projeto de Monitoria</Label>
            <Select value={selectedProjectId?.toString() || ""} onValueChange={handleSelectProject} disabled={loadingProjetos}>
              <SelectTrigger id="projeto">
                <SelectValue placeholder={projetosElegiveis.length > 0 ? "Selecione um projeto..." : "Nenhum projeto encontrado para este filtro"} />
              </SelectTrigger>
              <SelectContent>
                {projetosElegiveis.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{projeto.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {projeto.ano}.{getSemestreNumero(projeto.semestre as Semestre)} - {projeto.totalInscritos} candidatos
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projetosElegiveis.length === 0 && !loadingProjetos && (
            <p className="text-sm text-muted-foreground italic">
              Nenhum projeto aprovado encontrado para os filtros selecionados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Abas de Gerenciamento da Seleção */}
      {selectedProjectId && dadosAta && (
        <Tabs defaultValue="documentos" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documentos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Documentos
            </TabsTrigger>
            <TabsTrigger value="candidatos" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Candidatos ({dadosAta.totalInscritos})
            </TabsTrigger>
            <TabsTrigger value="publicar" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Publicar Resultados
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: GERAR DOCUMENTOS */}
          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gerar Documentos de Seleção
                </CardTitle>
                <CardDescription>Gere o PDF das Atas ou das Tabelas de Resultados da Seleção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleGenerateAtaPDF("BOLSISTA")} disabled={loadingAta} className="bg-blue-600 hover:bg-blue-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Ata (Bolsistas)
                  </Button>
                  <Button onClick={() => handleGenerateAtaPDF("VOLUNTARIO")} disabled={loadingAta} className="bg-purple-600 hover:bg-purple-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Ata (Voluntários)
                  </Button>
                  <Button onClick={() => handleGenerateResultadoPDF("BOLSISTA")} disabled={loadingAta} className="bg-emerald-600 hover:bg-emerald-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Resultado Bolsistas
                  </Button>
                  <Button onClick={() => handleGenerateResultadoPDF("VOLUNTARIO")} disabled={loadingAta} className="bg-indigo-600 hover:bg-indigo-700">
                    <Eye className="w-4 h-4 mr-2" />
                    Resultado Voluntários
                  </Button>
                  <Button variant="outline" onClick={handleSaveAta} disabled={saveAtaMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Rascunho da Ata
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visualizador de PDF */}
            {showPDF && ataData && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {pdfMode === "RESULTADO" ? "Visualização do Resultado da Seleção" : "Visualização da Ata"}
                  </CardTitle>
                  <CardDescription>
                    Prévia do documento PDF {pdfMode === "RESULTADO" ? "de resultado da seleção" : "da ata de seleção"} ({selectedAtaType === "BOLSISTA" ? "Bolsistas" : "Voluntários"})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ height: "800px", width: "100%" }}>
                    <ClientOnlyPDFViewer width="100%" height="100%">
                      {pdfMode === "RESULTADO" ? (
                        <ResultadoSelecaoTemplate data={ataData} tipo={selectedAtaType} />
                      ) : (
                        <AtaSelecaoTemplate data={ataData} />
                      )}
                    </ClientOnlyPDFViewer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABA 2: CANDIDATOS */}
          <TabsContent value="candidatos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Candidatos e Classificação
                </CardTitle>
                <CardDescription>Resumo dos candidatos inscritos e aprovados no projeto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{dadosAta.totalInscritos}</div>
                      <div className="text-sm text-muted-foreground">Total Inscritos</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dadosAta.totalCompareceram}</div>
                      <div className="text-sm text-muted-foreground">Compareceram</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dadosAta.inscricoesBolsista.length}</div>
                      <div className="text-sm text-muted-foreground">Bolsistas Aprovados</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{dadosAta.inscricoesVoluntario.length}</div>
                      <div className="text-sm text-muted-foreground">Voluntários Aprovados</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Candidatos Aprovados</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {dadosAta.inscricoesBolsista.map((candidato) => (
                        <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{candidato.aluno.user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Nota Final: {candidato.notaFinal ? Number(candidato.notaFinal).toFixed(1) : "N/A"} | Tipo: Bolsista
                            </div>
                          </div>
                          <Badge variant="default">Bolsista</Badge>
                        </div>
                      ))}
                      {dadosAta.inscricoesVoluntario.map((candidato) => (
                        <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{candidato.aluno.user.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Nota Final: {candidato.notaFinal ? Number(candidato.notaFinal).toFixed(1) : "N/A"} | Tipo: Voluntário
                            </div>
                          </div>
                          <Badge variant="secondary">Voluntário</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: PUBLICAR RESULTADOS */}
          <TabsContent value="publicar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Publicar Resultados da Seleção
                </CardTitle>
                <CardDescription>
                  Oficialize a seleção do projeto e envie as notificações por e-mail para os candidatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border">
                  <Checkbox
                    id="notifyStudents"
                    checked={notifyStudents}
                    onCheckedChange={(checked) => setNotifyStudents(checked as boolean)}
                  />
                  <Label htmlFor="notifyStudents" className="text-sm font-medium cursor-pointer">
                    Enviar notificações por e-mail aos candidatos
                  </Label>
                </div>

                <div className="bg-muted/40 p-4 rounded-lg border space-y-2">
                  <div className="font-semibold text-base">{dadosAta.projeto.titulo}</div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span><strong>Total de Inscritos:</strong> {dadosAta.totalInscritos}</span>
                    <span><strong>Bolsistas Aprovados:</strong> {dadosAta.inscricoesBolsista.length}</span>
                    <span><strong>Voluntários Aprovados:</strong> {dadosAta.inscricoesVoluntario.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataSelecao">Data da Seleção</Label>
                    <Input
                      id="dataSelecao"
                      value={ataInfo.dataSelecao}
                      onChange={(e) => setAtaInfo((prev) => ({ ...prev, dataSelecao: e.target.value }))}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localSelecao">Local da Seleção (opcional)</Label>
                    <Input
                      id="localSelecao"
                      value={ataInfo.localSelecao}
                      onChange={(e) => setAtaInfo((prev) => ({ ...prev, localSelecao: e.target.value }))}
                      placeholder="Ex: Sala 123, Instituto de Computação"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações ou Mensagem aos Candidatos (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={ataInfo.observacoes}
                    onChange={(e) => setAtaInfo((prev) => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Adicione uma mensagem personalizada que será enviada no e-mail das notificações aos alunos..."
                    rows={3}
                  />
                </div>

                {/* Resumo dos Selecionados */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800">
                    <Award className="h-4 w-4 text-green-600" />
                    Candidatos Aprovados para Notificação (
                    {dadosAta.inscricoesBolsista.length + dadosAta.inscricoesVoluntario.length})
                  </h4>

                  {dadosAta.inscricoesBolsista.length + dadosAta.inscricoesVoluntario.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {dadosAta.inscricoesBolsista.map((c: SelecaoCandidato) => (
                        <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/60">
                          <div>
                            <div className="font-medium text-sm">{c.aluno.nomeCompleto || c.aluno.user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              Matrícula: {c.aluno.matricula}
                              {c.notaFinal && ` | Nota Final: ${Number(c.notaFinal).toFixed(1)}`}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-700">Bolsista</Badge>
                        </div>
                      ))}
                      {dadosAta.inscricoesVoluntario.map((c: SelecaoCandidato) => (
                        <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50/60">
                          <div>
                            <div className="font-medium text-sm">{c.aluno.nomeCompleto || c.aluno.user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              Matrícula: {c.aluno.matricula}
                              {c.notaFinal && ` | Nota Final: ${Number(c.notaFinal).toFixed(1)}`}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-purple-600 text-white">Voluntário</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nenhum candidato aprovado até o momento.</p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handlePublishResults}
                    disabled={publishResultsMutation.isPending}
                    size="lg"
                    className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-md px-6"
                  >
                    {publishResultsMutation.isPending ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    {notifyStudents ? "Publicar Resultados e Notificar Alunos" : "Publicar Resultados"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
