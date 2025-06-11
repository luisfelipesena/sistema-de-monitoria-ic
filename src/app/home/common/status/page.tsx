'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/utils/api'
import { FileCheck, Clock, Award, Users, Calendar, CheckCircle } from 'lucide-react'

export default function StatusPage() {
  const { data: status, isLoading } = api.inscricao.getMyStatus.useQuery()

  if (isLoading) {
    return (
      <PagesLayout title="Meu Status" subtitle="Acompanhe seu status na monitoria">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando seu status...</p>
          </div>
        </div>
      </PagesLayout>
    )
  }

  if (!status) {
    return (
      <PagesLayout title="Meu Status" subtitle="Acompanhe seu status na monitoria">
        <div className="text-center py-12 text-muted-foreground">
          <FileCheck className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Nenhum status encontrado
          </h3>
          <p>
            Você ainda não possui nenhuma atividade de monitoria.
          </p>
        </div>
      </PagesLayout>
    )
  }

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'ATIVO':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>
      case 'CONCLUIDO':
        return <Badge variant="secondary" className="bg-blue-500 text-white">Concluído</Badge>
      case 'SUSPENSO':
        return <Badge variant="destructive">Suspenso</Badge>
      case 'EM_ANDAMENTO':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Em Andamento</Badge>
      default:
        return <Badge variant="outline">{statusValue}</Badge>
    }
  }

  const calculateProgress = (inicio: Date, fim: Date) => {
    const now = new Date()
    const startTime = inicio.getTime()
    const endTime = fim.getTime()
    const currentTime = now.getTime()

    if (currentTime < startTime) return 0
    if (currentTime > endTime) return 100

    const totalDuration = endTime - startTime
    const elapsedDuration = currentTime - startTime
    return Math.round((elapsedDuration / totalDuration) * 100)
  }

  return (
    <PagesLayout title="Meu Status" subtitle="Acompanhe seu status na monitoria">
      <div className="space-y-6">
        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Status Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.totalInscricoes}</div>
                <div className="text-sm text-muted-foreground">Inscrições Realizadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.totalAprovacoes}</div>
                <div className="text-sm text-muted-foreground">Aprovações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.monitoriaAtiva ? 1 : 0}</div>
                <div className="text-sm text-muted-foreground">Monitoria Ativa</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoria Atual */}
        {status.monitoriaAtiva && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Monitoria Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{status.monitoriaAtiva.projeto.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {status.monitoriaAtiva.projeto.disciplinas[0]?.codigo} - {status.monitoriaAtiva.projeto.professorResponsavelNome}
                  </p>
                </div>
                {getStatusBadge(status.monitoriaAtiva.status)}
              </div>

              <div className="flex items-center gap-2">
                {status.monitoriaAtiva.tipo === 'BOLSISTA' ? (
                  <Award className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Users className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm">
                  {status.monitoriaAtiva.tipo === 'BOLSISTA' ? 'Monitor Bolsista' : 'Monitor Voluntário'}
                </span>
              </div>

              {status.monitoriaAtiva.dataInicio && status.monitoriaAtiva.dataFim && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Período: {new Date(status.monitoriaAtiva.dataInicio).toLocaleDateString('pt-BR')} - {new Date(status.monitoriaAtiva.dataFim).toLocaleDateString('pt-BR')}</span>
                    <span>{calculateProgress(new Date(status.monitoriaAtiva.dataInicio), new Date(status.monitoriaAtiva.dataFim))}%</span>
                  </div>
                  <Progress value={calculateProgress(new Date(status.monitoriaAtiva.dataInicio), new Date(status.monitoriaAtiva.dataFim))} />
                </div>
              )}

              {status.monitoriaAtiva.cargaHorariaCumprida !== undefined && status.monitoriaAtiva.cargaHorariaPlanejada && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Carga Horária: {status.monitoriaAtiva.cargaHorariaCumprida}h / {status.monitoriaAtiva.cargaHorariaPlanejada}h</span>
                    <span>{Math.round((status.monitoriaAtiva.cargaHorariaCumprida / status.monitoriaAtiva.cargaHorariaPlanejada) * 100)}%</span>
                  </div>
                  <Progress value={(status.monitoriaAtiva.cargaHorariaCumprida / status.monitoriaAtiva.cargaHorariaPlanejada) * 100} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Histórico de Atividades */}
        {status.historicoAtividades && status.historicoAtividades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {status.historicoAtividades.map((atividade: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {atividade.tipo === 'APROVACAO' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : atividade.tipo === 'INICIO_MONITORIA' ? (
                        <Award className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{atividade.descricao}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(atividade.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximas Ações */}
        {status.proximasAcoes && status.proximasAcoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.proximasAcoes.map((acao: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{acao.titulo}</div>
                      <div className="text-sm text-muted-foreground">{acao.descricao}</div>
                      {acao.prazo && (
                        <div className="text-xs text-blue-600 font-medium">
                          Prazo: {new Date(acao.prazo).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PagesLayout>
  )
}