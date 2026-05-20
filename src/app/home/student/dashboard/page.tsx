'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { api } from '@/utils/api'
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Trophy,
  User,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const { data: status, isLoading, error } = api.inscricao.getMyStatus.useQuery()
  const { data: inscricoes } = api.inscricao.getMinhasInscricoes.useQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Estudante</h1>
          <p className="text-muted-foreground">
            Acompanhe suas inscrições, resultados e atividades de monitoria.
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Estudante</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Erro ao carregar dados: {error.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = status?.totalInscricoes ? (status.totalAprovacoes / status.totalInscricoes) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard do Estudante</h1>
        <p className="text-muted-foreground">
          Acompanhe suas inscrições, resultados e atividades de monitoria.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.totalInscricoes ?? 0}</div>
            <p className="text-xs text-muted-foreground">inscrições realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.totalAprovacoes ?? 0}</div>
            <p className="text-xs text-muted-foreground">aprovações obtidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Atual</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={status?.monitoriaAtiva ? 'default' : 'secondary'}>
                {status?.monitoriaAtiva ? 'Monitor Ativo' : 'Disponível'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {status?.monitoriaAtiva ? 'monitoria em andamento' : 'disponível para inscrições'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Monitoria Ativa */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Monitoria Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.monitoriaAtiva ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{status.monitoriaAtiva.projeto.titulo}</h3>
                    <p className="text-sm text-muted-foreground">
                      Professor: {status.monitoriaAtiva.projeto.professorResponsavelNome}
                    </p>
                  </div>
                  <Badge variant="outline">{status.monitoriaAtiva.tipo}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disciplinas:</span>
                    <span>
                      {status.monitoriaAtiva.projeto.disciplinas
                        .map((d) => `${d.codigo} - ${d.nome}`)
                        .join(', ')}
                    </span>
                  </div>
                  {status.monitoriaAtiva.dataInicio && (
                    <div className="flex justify-between text-sm">
                      <span>Período:</span>
                      <span>
                        {status.monitoriaAtiva.dataInicio?.toLocaleDateString('pt-BR')} a{' '}
                        {status.monitoriaAtiva.dataFim?.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {status.monitoriaAtiva.cargaHorariaPlanejada && (
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Carga Horária</span>
                      <span>
                        {status.monitoriaAtiva.cargaHorariaCumprida || 0} /{' '}
                        {status.monitoriaAtiva.cargaHorariaPlanejada}h
                      </span>
                    </div>
                    <Progress
                      value={
                        ((status.monitoriaAtiva.cargaHorariaCumprida || 0) /
                          status.monitoriaAtiva.cargaHorariaPlanejada) *
                        100
                      }
                    />
                  </div>
                )}

                <Separator />
                <div className="flex gap-2">
                  <Link
                    href="/home/common/status"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Activity className="h-3 w-3" />
                    Ver detalhes completos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma monitoria ativa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Você não possui monitoria ativa no momento. Que tal se inscrever em um projeto?
                </p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href="/home/student/vagas"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Award className="h-3 w-3" />
                    Ver vagas disponíveis
                  </Link>
                  <Link
                    href="/home/student/inscricao-monitoria"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Nova inscrição
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Ações */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status?.proximasAcoes && status.proximasAcoes.length > 0 ? (
              <div className="space-y-3">
                {status.proximasAcoes.map((acao, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{acao.titulo}</p>
                      <p className="text-xs text-muted-foreground">{acao.descricao}</p>
                      {acao.prazo && (
                        <p className="text-xs text-orange-600 mt-1">
                          Prazo: {acao.prazo.toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma ação pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Atividades */}
      {status?.historicoAtividades && status.historicoAtividades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Histórico de Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.historicoAtividades.slice(0, 5).map((atividade, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {atividade.tipo}
                    </Badge>
                    <span className="text-sm">{atividade.descricao}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {atividade.data.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
              {status.historicoAtividades.length > 5 && (
                <div className="pt-2 text-center">
                  <Link
                    href="/home/common/status"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver histórico completo
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/home/student/vagas')}>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Vagas Disponíveis</h3>
            <p className="text-xs text-muted-foreground">Veja todas as vagas abertas</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/home/student/inscricao-monitoria')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Nova Inscrição</h3>
            <p className="text-xs text-muted-foreground">Inscreva-se em um projeto</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/home/student/resultados')}>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Resultados</h3>
            <p className="text-xs text-muted-foreground">Acompanhe seus resultados</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/home/common/status')}>
          <CardContent className="p-6 text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-1">Meu Status</h3>
            <p className="text-xs text-muted-foreground">Status completo da monitoria</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}