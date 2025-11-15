"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PDFDownloadWrapper } from "@/components/ui/pdf-download-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TIPO_VAGA_BOLSISTA, TIPO_VAGA_LABELS, TIPO_VAGA_VOLUNTARIO, type TipoVaga } from "@/types"
import { api } from "@/utils/api"
import { AlertCircle, Award, CheckCircle, Clock, FileText, MessageSquare, Users, XCircle } from "lucide-react"
import { useState } from "react"

export default function ResultadosPage() {
  const { toast } = useToast()
  const [selectedInscricao, setSelectedInscricao] = useState<number | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Buscar inscrições do aluno
  const { data: inscricoes, isLoading, refetch } = api.inscricao.getMinhasInscricoes.useQuery()

  // Mutation para aceitar vaga
  const aceitarVagaMutation = api.vagas.acceptVaga.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Mutation para recusar vaga
  const recusarVagaMutation = api.vagas.rejectVaga.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      })
      setShowRejectDialog(false)
      setMotivoRecusa("")
      setSelectedInscricao(null)
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleAccept = (inscricaoId: number, tipoVagaPretendida: string) => {
    aceitarVagaMutation.mutate({
      inscricaoId: inscricaoId.toString(),
      tipoBolsa: tipoVagaPretendida as TipoVaga,
    })
  }

  const handleRejectClick = (inscricaoId: number) => {
    setSelectedInscricao(inscricaoId)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = () => {
    if (selectedInscricao) {
      recusarVagaMutation.mutate({
        inscricaoId: selectedInscricao.toString(),
        motivo: motivoRecusa || undefined,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED_BOLSISTA":
        return <Badge className="bg-green-500">Selecionado (Bolsista)</Badge>
      case "SELECTED_VOLUNTARIO":
        return <Badge className="bg-blue-500">Selecionado (Voluntário)</Badge>
      case "ACCEPTED_BOLSISTA":
        return <Badge className="bg-green-600">Aceito (Bolsista)</Badge>
      case "ACCEPTED_VOLUNTARIO":
        return <Badge className="bg-blue-600">Aceito (Voluntário)</Badge>
      case "REJECTED_BY_PROFESSOR":
        return <Badge variant="destructive">Não Selecionado</Badge>
      case "REJECTED_BY_STUDENT":
        return <Badge variant="outline">Recusado por Você</Badge>
      case "WAITING_LIST":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            Lista de Espera
          </Badge>
        )
      case "SUBMITTED":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Em Análise
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoVagaIcon = (tipo: string | null | undefined) => {
    switch (tipo) {
      case TIPO_VAGA_LABELS.BOLSISTA:
        return <Award className="h-4 w-4 text-yellow-600" />
      case TIPO_VAGA_LABELS.VOLUNTARIO:
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    if (status.includes("SELECTED_")) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (status.includes("ACCEPTED_")) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status.includes("REJECTED_")) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const canAcceptOrReject = (status: string) => {
    return status === "SELECTED_BOLSISTA" || status === "SELECTED_VOLUNTARIO"
  }

  const isAccepted = (status: string) => {
    return status === "ACCEPTED_BOLSISTA" || status === "ACCEPTED_VOLUNTARIO"
  }

  // Component para download do termo de compromisso
  function TermoCompromissoDownload({ inscricaoId }: { inscricaoId: number }) {
    const { data: termoData, isLoading } = api.inscricao.generateCommitmentTermData.useQuery(
      { inscricaoId },
      { enabled: !!inscricaoId }
    )

    if (isLoading) {
      return (
        <Button variant="outline" disabled size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Carregando...
        </Button>
      )
    }

    if (!termoData) {
      return null
    }

    return (
      <PDFDownloadWrapper
        pdfData={termoData}
        fileName={`termo-compromisso-${termoData.termo.numero}.pdf`}
        buttonText="Baixar Termo"
        size="sm"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resultados</h1>
          <p className="text-muted-foreground">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  const inscricoesComResultado = inscricoes?.filter((i) => !["SUBMITTED", "UNDER_REVIEW"].includes(i.status)) || []

  const inscricoesSelecionadas = inscricoesComResultado.filter(
    (i) => i.status.includes("SELECTED_") || i.status.includes("ACCEPTED_")
  )

  const inscricoesRejeitadas = inscricoesComResultado.filter((i) => i.status.includes("REJECTED_"))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resultados da Seleção</h1>
        <p className="text-muted-foreground">Acompanhe os resultados das suas inscrições em projetos de monitoria</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{inscricoesSelecionadas.length}</div>
                <div className="text-sm text-muted-foreground">Selecionado(a)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {inscricoesSelecionadas.filter((i) => i.status.includes("BOLSISTA")).length}
                </div>
                <div className="text-sm text-muted-foreground">Bolsas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {inscricoesSelecionadas.filter((i) => i.status.includes("VOLUNTARIO")).length}
                </div>
                <div className="text-sm text-muted-foreground">Voluntário</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{inscricoesComResultado.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados Positivos */}
      {inscricoesSelecionadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Parabéns! Você foi selecionado(a)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inscricoesSelecionadas.map((inscricao) => (
                <div key={inscricao.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(inscricao.status)}
                        <h3 className="font-semibold text-lg">{inscricao.projeto.titulo}</h3>
                        {getTipoVagaIcon(inscricao.tipoVagaPretendida)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Professor: {inscricao.projeto.professorResponsavel.nomeCompleto}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Disciplinas: {inscricao.projeto.disciplinas.map((d) => `${d.codigo} (${d.turma})`).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        {getStatusBadge(inscricao.status)}
                        {inscricao.notaFinal && (
                          <span className="text-sm text-green-700 font-medium">
                            Nota Final: {Number(inscricao.notaFinal).toFixed(1)}
                          </span>
                        )}
                      </div>
                      {inscricao.feedbackProfessor && (
                        <div className="bg-white p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-green-800 mb-1">Mensagem do Professor:</p>
                          <p className="text-sm text-green-700">{inscricao.feedbackProfessor}</p>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    {canAcceptOrReject(inscricao.status) && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleAccept(inscricao.id, inscricao.tipoVagaPretendida as string)}
                          disabled={aceitarVagaMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectClick(inscricao.id)}
                          disabled={recusarVagaMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    )}

                    {inscricao.status.includes("ACCEPTED_") && (
                      <div className="ml-4 space-y-2">
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Vaga Aceita
                        </Badge>
                        <div>
                          <TermoCompromissoDownload inscricaoId={inscricao.id} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados Negativos */}
      {inscricoesRejeitadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <MessageSquare className="h-5 w-5" />
              Outras Inscrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inscricoesRejeitadas.map((inscricao) => (
                <div key={inscricao.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(inscricao.status)}
                        <h3 className="font-semibold">{inscricao.projeto.titulo}</h3>
                        {getTipoVagaIcon(inscricao.tipoVagaPretendida)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Professor: {inscricao.projeto.professorResponsavel.nomeCompleto}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(inscricao.status)}
                        {inscricao.notaFinal && (
                          <span className="text-sm text-muted-foreground">
                            Nota Final: {Number(inscricao.notaFinal).toFixed(1)}
                          </span>
                        )}
                      </div>
                      {inscricao.feedbackProfessor && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                          <p className="text-sm text-gray-600">{inscricao.feedbackProfessor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inscricoesComResultado.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum resultado disponível</h3>
            <p className="text-muted-foreground">
              Os resultados das suas inscrições aparecerão aqui quando a seleção for concluída.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Recusa */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Vaga</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja recusar esta vaga? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="motivo">Motivo da recusa (opcional)</Label>
              <Textarea
                id="motivo"
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Ex: Conflito de horários, encontrei outra oportunidade..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={recusarVagaMutation.isPending}>
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
