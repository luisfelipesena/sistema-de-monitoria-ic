'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/utils/api'
import {
  RELATORIO_STATUS_LABELS,
  SEMESTRE_LABELS,
  type RelatorioFinalMonitorContent,
  type RelatorioStatus,
  type Semestre,
} from '@/types'
import { AlertCircle, CheckCircle, Clock, FileText, Loader2, PenLine } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function RelatoriosAlunoPage() {
  const [selectedRelatorio, setSelectedRelatorio] = useState<number | null>(null)

  const utils = api.useUtils()

  const { data: relatorios, isLoading } = api.relatoriosFinais.listRelatoriosPendentesAluno.useQuery()

  const { data: relatorioDetails, isLoading: loadingDetails } =
    api.relatoriosFinais.getRelatorioMonitorAluno.useQuery(
      { relatorioId: selectedRelatorio! },
      { enabled: !!selectedRelatorio }
    )

  const signRelatorio = api.relatoriosFinais.signRelatorioMonitorAsAluno.useMutation({
    onSuccess: () => {
      toast.success('Relatório assinado com sucesso!')
      setSelectedRelatorio(null)
      utils.relatoriosFinais.listRelatoriosPendentesAluno.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const handleSign = () => {
    if (!selectedRelatorio) return
    signRelatorio.mutate({ relatorioId: selectedRelatorio })
  }

  const getStatusBadge = (status: RelatorioStatus) => {
    const colors: Record<RelatorioStatus, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return <Badge className={colors[status]}>{RELATORIO_STATUS_LABELS[status]}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Relatórios de Monitoria</h1>
        <p className="text-muted-foreground">
          Visualize e assine os relatórios finais das suas monitorias
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Sobre os Relatórios Finais</p>
            <p>
              Após o professor assinar seu relatório de monitoria, você precisa revisar e assinar para
              concluir o processo. Isso é necessário para a emissão do seu certificado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Pendentes */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pendentes de Assinatura
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : relatorios?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">
                Você não tem relatórios pendentes de assinatura.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {relatorios?.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedRelatorio(r.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{r.projeto.titulo}</CardTitle>
                      <CardDescription>
                        {r.projeto.disciplinaNome} • {r.projeto.ano}/
                        {SEMESTRE_LABELS[r.projeto.semestre as Semestre]}
                      </CardDescription>
                    </div>
                    {getStatusBadge(r.status as RelatorioStatus)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Professor: {r.projeto.professorResponsavel.nomeCompleto}</p>
                      {r.professorAssinouEm && (
                        <p className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Professor já assinou
                        </p>
                      )}
                    </div>
                    <Button size="sm">
                      <PenLine className="h-4 w-4 mr-1" /> Revisar e Assinar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Relatório Details Dialog */}
      <Dialog open={!!selectedRelatorio} onOpenChange={(open) => !open && setSelectedRelatorio(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {loadingDetails ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : relatorioDetails ? (
            <>
              <DialogHeader>
                <DialogTitle>Relatório de Monitoria</DialogTitle>
                <DialogDescription>
                  {relatorioDetails.projeto.titulo} • {relatorioDetails.projeto.ano}/
                  {SEMESTRE_LABELS[relatorioDetails.projeto.semestre as Semestre]}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(relatorioDetails.status as RelatorioStatus)}
                  {relatorioDetails.professorAssinouEm && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Professor Assinou
                    </Badge>
                  )}
                </div>

                {/* Conteúdo do Relatório */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Avaliação do Professor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Desempenho Geral</Label>
                      <p className="text-sm mt-1">{relatorioDetails.conteudo.desempenhoGeral}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Atividades Realizadas</Label>
                      <p className="text-sm mt-1">{relatorioDetails.conteudo.atividadesRealizadas}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Frequência</Label>
                        <p className="text-sm mt-1">{relatorioDetails.conteudo.frequencia}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Nota Final</Label>
                        <p className="text-sm mt-1 font-semibold text-lg">
                          {relatorioDetails.conteudo.notaFinal}/10
                        </p>
                      </div>
                    </div>
                    {relatorioDetails.conteudo.avaliacaoQualitativa && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Avaliação Qualitativa</Label>
                        <p className="text-sm mt-1">{relatorioDetails.conteudo.avaliacaoQualitativa}</p>
                      </div>
                    )}
                    {relatorioDetails.conteudo.observacoes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Observações</Label>
                        <p className="text-sm mt-1">{relatorioDetails.conteudo.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações adicionais */}
                <div className="text-sm text-muted-foreground">
                  <p>Professor: {relatorioDetails.projeto.professorResponsavel.nomeCompleto}</p>
                </div>

                {/* Aviso */}
                {!relatorioDetails.alunoAssinouEm && relatorioDetails.professorAssinouEm && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="py-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Atenção</p>
                        <p>
                          Ao assinar este relatório, você concorda com a avaliação apresentada. Esta
                          ação não pode ser desfeita.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRelatorio(null)}>
                  Fechar
                </Button>
                {!relatorioDetails.alunoAssinouEm && relatorioDetails.professorAssinouEm && (
                  <Button onClick={handleSign} disabled={signRelatorio.isPending}>
                    {signRelatorio.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <PenLine className="h-4 w-4 mr-1" /> Assinar Relatório
                  </Button>
                )}
                {relatorioDetails.alunoAssinouEm && (
                  <Badge variant="outline" className="text-green-600 py-2 px-4">
                    <CheckCircle className="h-4 w-4 mr-1" /> Você já assinou este relatório
                  </Badge>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
