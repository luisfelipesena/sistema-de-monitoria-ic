"use client"

import { StatusBadge } from "@/components/atoms/StatusBadge"
import { BankDataModal } from "@/components/features/student"
import { PagesLayout } from "@/components/layout/PagesLayout"
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
import {
  STATUS_INSCRICAO_ACCEPTED_BOLSISTA,
  STATUS_INSCRICAO_ACCEPTED_VOLUNTARIO,
  STATUS_INSCRICAO_REJECTED_BY_PROFESSOR,
  STATUS_INSCRICAO_REJECTED_BY_STUDENT,
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
  STATUS_INSCRICAO_SUBMITTED,
  TIPO_VAGA_BOLSISTA,
  TIPO_VAGA_VOLUNTARIO,
  type StatusInscricao,
  type TipoVaga,
} from "@/types"
import { api } from "@/utils/api"
import { AlertCircle, Award, CheckCircle, Clock, FileText, MessageSquare, Users, XCircle } from "lucide-react"
import { useState } from "react"

const SELECTED_STATUSES = new Set<StatusInscricao>([
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
])
const ACCEPTED_STATUSES = new Set<StatusInscricao>([
  STATUS_INSCRICAO_ACCEPTED_BOLSISTA,
  STATUS_INSCRICAO_ACCEPTED_VOLUNTARIO,
])
const REJECTED_STATUSES = new Set<StatusInscricao>([
  STATUS_INSCRICAO_REJECTED_BY_PROFESSOR,
  STATUS_INSCRICAO_REJECTED_BY_STUDENT,
])
const BOLSISTA_STATUSES = new Set<StatusInscricao>([
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_ACCEPTED_BOLSISTA,
])
const VOLUNTARIO_STATUSES = new Set<StatusInscricao>([
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
  STATUS_INSCRICAO_ACCEPTED_VOLUNTARIO,
])
const PENDING_STATUSES = new Set<StatusInscricao>([STATUS_INSCRICAO_SUBMITTED])

export default function ResultadosPage() {
  const { toast } = useToast()
  const [selectedInscricao, setSelectedInscricao] = useState<number | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [pendingAccept, setPendingAccept] = useState<{ id: number; tipo: TipoVaga } | null>(null)

  // Buscar perfil do aluno (para verificar dados bancários)
  const { data: userProfile } = api.user.getProfile.useQuery()

  // Buscar inscrições do aluno
  const { data: inscricoes, isLoading, refetch } = api.inscricao.getMinhasInscricoes.useQuery()

  // Verificar se dados bancários estão completos
  const hasBankData = () => {
    const aluno = userProfile?.studentProfile
    return !!(aluno?.banco && aluno?.agencia && aluno?.conta)
  }

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

  const handleAccept = (inscricaoId: number, tipoVagaPretendida: TipoVaga) => {
    // Se for bolsista e não tiver dados bancários, abrir modal
    if (tipoVagaPretendida === TIPO_VAGA_BOLSISTA && !hasBankData()) {
      setPendingAccept({ id: inscricaoId, tipo: tipoVagaPretendida })
      setShowBankModal(true)
      return
    }

    aceitarVagaMutation.mutate({
      inscricaoId: inscricaoId.toString(),
      tipoBolsa: tipoVagaPretendida,
    })
  }

  const handleBankDataSaved = () => {
    setShowBankModal(false)
    if (pendingAccept) {
      aceitarVagaMutation.mutate({
        inscricaoId: pendingAccept.id.toString(),
        tipoBolsa: pendingAccept.tipo,
      })
      setPendingAccept(null)
    }
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

  const getTipoVagaIcon = (tipo: TipoVaga | null | undefined) => {
    switch (tipo) {
      case TIPO_VAGA_BOLSISTA:
        return <Award className="h-4 w-4 text-yellow-600" />
      case TIPO_VAGA_VOLUNTARIO:
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: StatusInscricao) => {
    if (SELECTED_STATUSES.has(status)) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (ACCEPTED_STATUSES.has(status)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (REJECTED_STATUSES.has(status)) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const canAcceptOrReject = (status: StatusInscricao) => {
    return SELECTED_STATUSES.has(status)
  }

  const isAccepted = (status: StatusInscricao) => {
    return ACCEPTED_STATUSES.has(status)
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
      <PagesLayout title="Resultados da Seleção" subtitle="Carregando resultados...">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PagesLayout>
    )
  }

  const inscricoesComResultado = inscricoes?.filter((i) => !PENDING_STATUSES.has(i.status as StatusInscricao)) || []

  const inscricoesSelecionadas = inscricoesComResultado.filter((i) => {
    const status = i.status as StatusInscricao
    return SELECTED_STATUSES.has(status) || ACCEPTED_STATUSES.has(status)
  })

  const inscricoesRejeitadas = inscricoesComResultado.filter((i) => REJECTED_STATUSES.has(i.status as StatusInscricao))

  return (
    <PagesLayout
      title="Resultados da Seleção"
      subtitle="Acompanhe os resultados das suas inscrições em projetos de monitoria"
    >
      <div className="space-y-6">
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
                    {inscricoesSelecionadas.filter((i) => BOLSISTA_STATUSES.has(i.status as StatusInscricao)).length}
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
                    {inscricoesSelecionadas.filter((i) => VOLUNTARIO_STATUSES.has(i.status as StatusInscricao)).length}
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
                    {(() => {
                      const status = inscricao.status as StatusInscricao
                      const tipoVaga = inscricao.tipoVagaPretendida as TipoVaga | null
                      return (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(status)}
                              <h3 className="font-semibold text-lg">{inscricao.projeto.titulo}</h3>
                              {getTipoVagaIcon(tipoVaga)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Professor: {inscricao.projeto.professorResponsavel.nomeCompleto}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Disciplinas:{" "}
                              {inscricao.projeto.disciplinas.map((d) => d.codigo).join(", ")}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <StatusBadge status={status} />
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
                          {canAcceptOrReject(status) && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() => handleAccept(inscricao.id, tipoVaga ?? TIPO_VAGA_BOLSISTA)}
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

                          {ACCEPTED_STATUSES.has(status) && (
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
                      )
                    })()}
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
                    {(() => {
                      const status = inscricao.status as StatusInscricao
                      const tipoVaga = inscricao.tipoVagaPretendida as TipoVaga | null
                      return (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(status)}
                              <h3 className="font-semibold">{inscricao.projeto.titulo}</h3>
                              {getTipoVagaIcon(tipoVaga)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Professor: {inscricao.projeto.professorResponsavel.nomeCompleto}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <StatusBadge status={status} />
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
                      )
                    })()}
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

        {/* Modal de Dados Bancários (para bolsistas) */}
        <BankDataModal
          open={showBankModal}
          onClose={() => {
            setShowBankModal(false)
            setPendingAccept(null)
          }}
          onSuccess={handleBankDataSaved}
          currentData={userProfile?.studentProfile}
        />
      </div>
    </PagesLayout>
  )
}
