'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SEMESTRE_LABELS, type RelatorioFinalDisciplinaContent, type RelatorioStatus, type Semestre } from '@/types'
import { CheckCircle, Clock, Edit, Loader2, Plus } from 'lucide-react'
import { RelatorioStatusBadge } from './RelatorioStatusBadge'

interface MonitorData {
  inscricaoId: number
  alunoId: number
  nomeCompleto: string
  matricula: string | null
  tipoVaga: string
  relatorioId: number | null
  relatorioStatus?: string | null
  alunoAssinouEm?: Date | null
  professorAssinouEm?: Date | null
}

interface ProjetoDetailsData {
  id: number | null
  projetoId: number
  conteudo: RelatorioFinalDisciplinaContent | null
  status: RelatorioStatus | null
  professorAssinouEm: Date | null
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    disciplinaNome: string | null
    professorResponsavel: {
      id: number
      nomeCompleto: string
    }
  }
  monitores: MonitorData[]
}

interface ProjetoDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  details: ProjetoDetailsData | null
  onCreateRelatorio: () => void
  onEditRelatorio: () => void
  onSignRelatorio: () => void
  onCreateMonitorRelatorio: (inscricaoId: number, nomeCompleto: string, relatorioDisciplinaId: number) => void
  onSignMonitorRelatorio: (relatorioId: number) => void
}

export function ProjetoDetailsDialog({
  open,
  onOpenChange,
  loading,
  details,
  onCreateRelatorio,
  onEditRelatorio,
  onSignRelatorio,
  onCreateMonitorRelatorio,
  onSignMonitorRelatorio,
}: ProjetoDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : details ? (
          <>
            <DialogHeader>
              <DialogTitle>{details.projeto.titulo}</DialogTitle>
              <DialogDescription>
                {details.projeto.disciplinaNome} • {details.projeto.ano}/
                {SEMESTRE_LABELS[details.projeto.semestre as Semestre]}
              </DialogDescription>
            </DialogHeader>

            {/* Relatório da Disciplina */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Relatório da Disciplina</h3>
                {details.id ? (
                  <RelatorioStatusBadge status={details.status} />
                ) : (
                  <Button size="sm" onClick={onCreateRelatorio}>
                    <Plus className="h-4 w-4 mr-1" /> Criar Relatório
                  </Button>
                )}
              </div>

              {details.id && details.conteudo && (
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Resumo das Atividades</Label>
                      <p className="text-sm">{details.conteudo.resumoAtividades}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Avaliação Geral</Label>
                      <p className="text-sm">{details.conteudo.avaliacaoGeral}</p>
                    </div>
                    {details.conteudo.dificuldadesEncontradas && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Dificuldades</Label>
                        <p className="text-sm">{details.conteudo.dificuldadesEncontradas}</p>
                      </div>
                    )}

                    {!details.professorAssinouEm && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={onEditRelatorio}>
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button size="sm" onClick={onSignRelatorio}>
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
                {details.monitores?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum monitor aceito neste projeto.</p>
                ) : (
                  <div className="space-y-2">
                    {details.monitores?.map((m) => (
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
                                <RelatorioStatusBadge status={m.relatorioStatus as RelatorioStatus | null} />
                                {m.professorAssinouEm ? (
                                  <Badge variant="outline" className="text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Prof. Assinou
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onSignMonitorRelatorio(m.relatorioId!)}
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
                            ) : details.id ? (
                              <Button
                                size="sm"
                                onClick={() => onCreateMonitorRelatorio(m.inscricaoId, m.nomeCompleto, details.id!)}
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
  )
}
