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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/utils/api'
import {
  RELATORIO_STATUS_LABELS,
  SEMESTRE_LABELS,
  type RelatorioFinalDisciplinaContent,
  type RelatorioFinalMonitorContent,
  type RelatorioStatus,
  type Semestre,
} from '@/types'
import { CheckCircle, Clock, Edit, FileText, Loader2, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function RelatoriosFinaisPage() {
  const [ano, setAno] = useState<number | undefined>(currentYear)
  const [semestre, setSemestre] = useState<Semestre | undefined>(undefined)

  // Dialog states
  const [selectedProjeto, setSelectedProjeto] = useState<number | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [selectedMonitor, setSelectedMonitor] = useState<{
    inscricaoId: number
    nomeCompleto: string
    relatorioDisciplinaId: number
  } | null>(null)

  // Form states
  const [disciplinaForm, setDisciplinaForm] = useState<RelatorioFinalDisciplinaContent>({
    resumoAtividades: '',
    avaliacaoGeral: '',
    dificuldadesEncontradas: '',
    sugestoesMelhorias: '',
    observacoes: '',
  })

  const [monitorForm, setMonitorForm] = useState<RelatorioFinalMonitorContent>({
    desempenhoGeral: '',
    atividadesRealizadas: '',
    frequencia: '',
    notaFinal: 0,
    avaliacaoQualitativa: '',
    observacoes: '',
  })

  const utils = api.useUtils()

  const { data: relatorios, isLoading } = api.relatoriosFinais.listRelatoriosDisciplina.useQuery(
    { ano, semestre },
    { enabled: true }
  )

  const { data: projetoDetails, isLoading: loadingDetails } =
    api.relatoriosFinais.getRelatorioDisciplina.useQuery(
      { projetoId: selectedProjeto! },
      { enabled: !!selectedProjeto }
    )

  const createRelatorioDisciplina = api.relatoriosFinais.createRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório criado com sucesso!')
      setShowCreateDialog(false)
      utils.relatoriosFinais.listRelatoriosDisciplina.invalidate()
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const updateRelatorioDisciplina = api.relatoriosFinais.updateRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório atualizado!')
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const signRelatorioDisciplina = api.relatoriosFinais.signRelatorioDisciplina.useMutation({
    onSuccess: () => {
      toast.success('Relatório assinado com sucesso!')
      utils.relatoriosFinais.listRelatoriosDisciplina.invalidate()
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const createRelatorioMonitor = api.relatoriosFinais.createRelatorioMonitor.useMutation({
    onSuccess: () => {
      toast.success('Relatório do monitor criado!')
      setShowMonitorDialog(false)
      utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const signRelatorioMonitorAsProfessor =
    api.relatoriosFinais.signRelatorioMonitorAsProfessor.useMutation({
      onSuccess: () => {
        toast.success('Relatório do monitor assinado!')
        utils.relatoriosFinais.getRelatorioDisciplina.invalidate()
      },
      onError: (err: { message: string }) => toast.error(err.message),
    })

  const handleCreateDisciplinaRelatorio = () => {
    if (!selectedProjeto) return
    createRelatorioDisciplina.mutate({
      projetoId: selectedProjeto,
      conteudo: disciplinaForm,
    })
  }

  const handleSaveDisciplinaRelatorio = () => {
    if (!projetoDetails?.id) return
    updateRelatorioDisciplina.mutate({
      id: projetoDetails.id,
      conteudo: disciplinaForm,
    })
  }

  const handleSignDisciplinaRelatorio = () => {
    if (!projetoDetails?.id) return
    signRelatorioDisciplina.mutate({ relatorioId: projetoDetails.id })
  }

  const handleCreateMonitorRelatorio = () => {
    if (!selectedMonitor) return
    createRelatorioMonitor.mutate({
      inscricaoId: selectedMonitor.inscricaoId,
      relatorioDisciplinaId: selectedMonitor.relatorioDisciplinaId,
      conteudo: monitorForm,
    })
  }

  const handleSignMonitorRelatorio = (relatorioId: number) => {
    signRelatorioMonitorAsProfessor.mutate({ relatorioId })
  }

  const openProjetoDetails = (projetoId: number) => {
    setSelectedProjeto(projetoId)
  }

  const openCreateMonitorDialog = (inscricaoId: number, nomeCompleto: string, relatorioDisciplinaId: number) => {
    setSelectedMonitor({ inscricaoId, nomeCompleto, relatorioDisciplinaId })
    setMonitorForm({
      desempenhoGeral: '',
      atividadesRealizadas: '',
      frequencia: '',
      notaFinal: 0,
      avaliacaoQualitativa: '',
      observacoes: '',
    })
    setShowMonitorDialog(true)
  }

  const getStatusBadge = (status: RelatorioStatus | null) => {
    if (!status) return <Badge variant="outline">Não criado</Badge>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Finais</h1>
          <p className="text-muted-foreground">
            Gere relatórios finais das disciplinas e monitores
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-40">
            <Label>Ano</Label>
            <Select value={ano?.toString() ?? 'all'} onValueChange={(v) => setAno(v === 'all' ? undefined : Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Label>Semestre</Label>
            <Select
              value={semestre || 'all'}
              onValueChange={(v) => setSemestre(v === 'all' ? undefined : (v as Semestre))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SEMESTRE_1">{SEMESTRE_LABELS.SEMESTRE_1}</SelectItem>
                <SelectItem value="SEMESTRE_2">{SEMESTRE_LABELS.SEMESTRE_2}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : relatorios?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum projeto encontrado para o período selecionado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {relatorios?.map((r) => (
            <Card
              key={r.projetoId}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => openProjetoDetails(r.projetoId)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{r.projeto.titulo}</CardTitle>
                    <CardDescription>
                      {r.projeto.disciplinaNome} • {r.projeto.ano}/{SEMESTRE_LABELS[r.projeto.semestre as Semestre]}
                    </CardDescription>
                  </div>
                  {getStatusBadge(r.status as RelatorioStatus | null)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{r.totalMonitores} monitores</span>
                  </div>
                  {r.id > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>{r.monitoresAssinados}/{r.totalMonitores} assinados</span>
                    </div>
                  )}
                  {r.professorAssinouEm && (
                    <div className="flex items-center gap-1 text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>Relatório assinado</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProjeto} onOpenChange={(open) => !open && setSelectedProjeto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingDetails ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : projetoDetails ? (
            <>
              <DialogHeader>
                <DialogTitle>{projetoDetails.projeto.titulo}</DialogTitle>
                <DialogDescription>
                  {projetoDetails.projeto.disciplinaNome} • {projetoDetails.projeto.ano}/
                  {SEMESTRE_LABELS[projetoDetails.projeto.semestre as Semestre]}
                </DialogDescription>
              </DialogHeader>

              {/* Relatório da Disciplina */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Relatório da Disciplina</h3>
                  {projetoDetails.id ? (
                    getStatusBadge(projetoDetails.status as RelatorioStatus)
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setDisciplinaForm({
                          resumoAtividades: '',
                          avaliacaoGeral: '',
                          dificuldadesEncontradas: '',
                          sugestoesMelhorias: '',
                          observacoes: '',
                        })
                        setShowCreateDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Criar Relatório
                    </Button>
                  )}
                </div>

                {projetoDetails.id && projetoDetails.conteudo && (
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Resumo das Atividades</Label>
                        <p className="text-sm">{projetoDetails.conteudo.resumoAtividades}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Avaliação Geral</Label>
                        <p className="text-sm">{projetoDetails.conteudo.avaliacaoGeral}</p>
                      </div>
                      {projetoDetails.conteudo.dificuldadesEncontradas && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Dificuldades</Label>
                          <p className="text-sm">{projetoDetails.conteudo.dificuldadesEncontradas}</p>
                        </div>
                      )}

                      {!projetoDetails.professorAssinouEm && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setDisciplinaForm(projetoDetails.conteudo)
                            setShowCreateDialog(true)
                          }}>
                            <Edit className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" onClick={handleSignDisciplinaRelatorio}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Assinar Relatório
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Monitores */}
                <div className="pt-4">
                  <h3 className="font-semibold mb-3">Relatórios dos Monitores</h3>
                  {projetoDetails.monitores?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum monitor aceito neste projeto.</p>
                  ) : (
                    <div className="space-y-2">
                      {projetoDetails.monitores?.map((m: {
                        inscricaoId: number
                        alunoId: number
                        nomeCompleto: string
                        matricula: string | null
                        tipoVaga: string
                        relatorioId: number | null
                        relatorioStatus?: string | null
                        alunoAssinouEm?: Date | null
                        professorAssinouEm?: Date | null
                      }) => (
                        <Card key={m.inscricaoId}>
                          <CardContent className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{m.nomeCompleto}</p>
                              <p className="text-sm text-muted-foreground">
                                {m.matricula} • {m.tipoVaga}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.relatorioId ? (
                                <>
                                  {getStatusBadge(m.relatorioStatus as RelatorioStatus | null)}
                                  {m.professorAssinouEm ? (
                                    <Badge variant="outline" className="text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" /> Prof. Assinou
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSignMonitorRelatorio(m.relatorioId!)}
                                    >
                                      Assinar
                                    </Button>
                                  )}
                                  {m.alunoAssinouEm && (
                                    <Badge variant="outline" className="text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" /> Aluno Assinou
                                    </Badge>
                                  )}
                                </>
                              ) : projetoDetails.id ? (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    openCreateMonitorDialog(m.inscricaoId, m.nomeCompleto, projetoDetails.id!)
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Criar Relatório
                                </Button>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" /> Aguardando relatório disciplina
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Disciplina Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {projetoDetails?.id ? 'Editar Relatório da Disciplina' : 'Criar Relatório da Disciplina'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Resumo das Atividades *</Label>
              <Textarea
                value={disciplinaForm.resumoAtividades}
                onChange={(e) =>
                  setDisciplinaForm({ ...disciplinaForm, resumoAtividades: e.target.value })
                }
                placeholder="Descreva as atividades realizadas durante o período..."
                rows={4}
              />
            </div>
            <div>
              <Label>Avaliação Geral *</Label>
              <Textarea
                value={disciplinaForm.avaliacaoGeral}
                onChange={(e) =>
                  setDisciplinaForm({ ...disciplinaForm, avaliacaoGeral: e.target.value })
                }
                placeholder="Avaliação geral do programa de monitoria..."
                rows={4}
              />
            </div>
            <div>
              <Label>Dificuldades Encontradas</Label>
              <Textarea
                value={disciplinaForm.dificuldadesEncontradas}
                onChange={(e) =>
                  setDisciplinaForm({ ...disciplinaForm, dificuldadesEncontradas: e.target.value })
                }
                placeholder="Descreva as dificuldades encontradas..."
                rows={3}
              />
            </div>
            <div>
              <Label>Sugestões de Melhorias</Label>
              <Textarea
                value={disciplinaForm.sugestoesMelhorias}
                onChange={(e) =>
                  setDisciplinaForm({ ...disciplinaForm, sugestoesMelhorias: e.target.value })
                }
                placeholder="Sugestões para melhoria do programa..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={projetoDetails?.id ? handleSaveDisciplinaRelatorio : handleCreateDisciplinaRelatorio}
              disabled={createRelatorioDisciplina.isPending || updateRelatorioDisciplina.isPending}
            >
              {(createRelatorioDisciplina.isPending || updateRelatorioDisciplina.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {projetoDetails?.id ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Monitor Report Dialog */}
      <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Relatório do Monitor: {selectedMonitor?.nomeCompleto}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Desempenho Geral *</Label>
              <Textarea
                value={monitorForm.desempenhoGeral}
                onChange={(e) => setMonitorForm({ ...monitorForm, desempenhoGeral: e.target.value })}
                placeholder="Avaliação do desempenho do monitor..."
                rows={3}
              />
            </div>
            <div>
              <Label>Atividades Realizadas *</Label>
              <Textarea
                value={monitorForm.atividadesRealizadas}
                onChange={(e) =>
                  setMonitorForm({ ...monitorForm, atividadesRealizadas: e.target.value })
                }
                placeholder="Descrição das atividades realizadas pelo monitor..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência *</Label>
                <Select
                  value={monitorForm.frequencia}
                  onValueChange={(v) => setMonitorForm({ ...monitorForm, frequencia: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excelente (90-100%)">Excelente (90-100%)</SelectItem>
                    <SelectItem value="Boa (75-89%)">Boa (75-89%)</SelectItem>
                    <SelectItem value="Regular (60-74%)">Regular (60-74%)</SelectItem>
                    <SelectItem value="Insuficiente (<60%)">Insuficiente (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nota Final (0-10) *</Label>
                <Select
                  value={monitorForm.notaFinal.toString()}
                  onValueChange={(v) => setMonitorForm({ ...monitorForm, notaFinal: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Avaliação Qualitativa</Label>
              <Textarea
                value={monitorForm.avaliacaoQualitativa}
                onChange={(e) =>
                  setMonitorForm({ ...monitorForm, avaliacaoQualitativa: e.target.value })
                }
                placeholder="Comentários adicionais sobre o desempenho..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonitorDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMonitorRelatorio} disabled={createRelatorioMonitor.isPending}>
              {createRelatorioMonitor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
