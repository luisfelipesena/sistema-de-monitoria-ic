"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AtaSelecaoTemplate } from "@/server/lib/pdfTemplates/AtaSelecaoTemplate"
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
import { PDFViewer } from "@react-pdf/renderer"
import { Eye, FileText, Save } from "lucide-react"
import { useMemo, useState } from "react"

export default function AtasSelecaoPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [showPDF, setShowPDF] = useState(false)
  const [ataData, setAtaData] = useState<AtaSelecaoData | null>(null)
  const [ataInfo, setAtaInfo] = useState({
    dataSelecao: new Date().toLocaleDateString("pt-BR"),
    localSelecao: "",
    observacoes: "",
  })

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar dados da ata quando projeto for selecionado
  const { data: dadosAta, isLoading: loadingAta } = api.selecao.generateAtaData.useQuery(
    { projetoId: selectedProjectId?.toString() || "" },
    { enabled: !!selectedProjectId }
  )

  const pdfData: AtaSelecaoData | null = useMemo(() => {
    if (!dadosAta) return null

    const candidatos: AtaSelecaoData["candidatos"] = [
      ...dadosAta.inscricoesBolsista,
      ...dadosAta.inscricoesVoluntario,
    ].map((c: SelecaoCandidato) => ({
      id: c.id,
      aluno: {
        nomeCompleto: c.aluno.nomeCompleto,
        matricula: c.aluno.matricula,
        cr: c.aluno.cr,
      },
      tipoVagaPretendida: c.tipoVagaPretendida,
      notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
      notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
      coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
      notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
      status: c.status,
      observacoes: c.feedbackProfessor,
    }))

    return {
      ...dadosAta,
      projeto: {
        ...dadosAta.projeto,
        departamento: dadosAta.projeto.departamento || { nome: 'N/A', sigla: null },
      },
      candidatos: candidatos,
      ataInfo: {
        dataSelecao: new Date().toLocaleDateString("pt-BR"),
        localSelecao: "Online via Sistema de Monitoria",
        observacoes: "O processo seletivo ocorreu de forma remota, com base nas notas e CR dos candidatos.",
      },
    }
  }, [dadosAta])

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

  // Projetos que podem ter ata (com inscrições avaliadas)
  const projetosElegiveis =
    projetos?.filter((p) => p.status === PROJETO_STATUS_APPROVED && p.totalInscritos > 0) || []

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(parseInt(projectId))
    setShowPDF(false)
  }

  const handleGeneratePDF = () => {
    if (!dadosAta) return

    const dataForPDF: AtaSelecaoData = {
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
        dataSelecao: new Date().toLocaleDateString("pt-BR"),
        localSelecao: "Online via Sistema de Monitoria",
        observacoes: "O processo seletivo ocorreu de forma remota, com base nas notas e CR dos candidatos.",
      },
    }

    setAtaData(dataForPDF)
    setShowPDF(true)
  }

  const handleSaveAta = () => {
    if (!selectedProjectId) return

    saveAtaMutation.mutate({
      projetoId: selectedProjectId.toString(),
      notifyStudents: false,
      mensagemPersonalizada: ataInfo.observacoes,
    })
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case STATUS_INSCRICAO_SELECTED_BOLSISTA:
        return "Selecionado (Bolsista)"
      case STATUS_INSCRICAO_SELECTED_VOLUNTARIO:
        return "Selecionado (Voluntário)"
      case STATUS_INSCRICAO_REJECTED_BY_PROFESSOR:
        return "Não Selecionado"
      case STATUS_INSCRICAO_WAITING_LIST:
        return "Lista de Espera"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case STATUS_INSCRICAO_SELECTED_BOLSISTA:
        return "default"
      case STATUS_INSCRICAO_SELECTED_VOLUNTARIO:
        return "secondary"
      case STATUS_INSCRICAO_REJECTED_BY_PROFESSOR:
        return "destructive"
      case STATUS_INSCRICAO_WAITING_LIST:
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Atas de Seleção</h1>
        <p className="text-muted-foreground">Gere e gerencie atas de seleção dos seus projetos de monitoria</p>
      </div>

      {/* Seleção de Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Projeto
          </CardTitle>
          <CardDescription>Escolha um projeto para gerar a ata de seleção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto">Projeto de Monitoria</Label>
            <Select onValueChange={handleSelectProject} disabled={loadingProjetos}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto..." />
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
            <p className="text-sm text-muted-foreground">
              Nenhum projeto elegível encontrado. Para gerar uma ata, o projeto deve estar aprovado e ter candidatos
              inscritos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dados da Ata */}
      {selectedProjectId && dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Ata</CardTitle>
            <CardDescription>Configure as informações adicionais da ata de seleção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={ataInfo.observacoes}
                onChange={(e) => setAtaInfo((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o processo seletivo..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo dos Candidatos */}
      {dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Candidatos</CardTitle>
            <CardDescription>Resumo dos candidatos inscritos no projeto</CardDescription>
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
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dadosAta.inscricoesBolsista.map((candidato) => (
                    <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{candidato.aluno.user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Nota Final: {candidato.notaFinal} | Tipo: Bolsista
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
                          Nota Final: {candidato.notaFinal} | Tipo: Voluntário
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
      )}

      {/* Ações */}
      {selectedProjectId && dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>Gere o PDF da ata ou salve as informações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleGeneratePDF} disabled={loadingAta}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar PDF
              </Button>
              <Button variant="outline" onClick={handleSaveAta} disabled={saveAtaMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Ata
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualizador de PDF */}
      {showPDF && ataData && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização da Ata</CardTitle>
            <CardDescription>Prévia do documento PDF da ata de seleção</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "800px", width: "100%" }}>
              <PDFViewer width="100%" height="100%">
                <AtaSelecaoTemplate data={ataData} />
              </PDFViewer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
