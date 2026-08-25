"use client"

import { DadosSelecaoSection } from "@/components/features/projeto/DadosSelecaoSection"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    PROJETO_STATUS_APPROVED,
    type DashboardProjectItem,
} from "@/types"
import { api } from "@/utils/api"
import {
  ChevronDown,
  Eye,
  HelpCircle,
  Info,
  Loader2,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

export default function ProfessorEditalManagementPage() {
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()
  const { data: editais, isLoading: loadingEditais } = api.edital.getEditais.useQuery()
  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)

  // Pega o edital mais recente (último criado) para determinar o semestre vigente
  const editalVigente = useMemo(() => {
    if (!editais || editais.length === 0) return null
    // Ordena por createdAt descendente e pega o primeiro
    const sorted = [...editais].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted[0]
  }, [editais])

  // Filter approved projects that match the edital vigente's ano/semestre
  const projetosAprovados = useMemo(() => {
    if (!projetos) return []
    const periodo = editalVigente?.periodoInscricao
    if (!periodo) return projetos.filter((p) => p.status === PROJETO_STATUS_APPROVED) as DashboardProjectItem[]
    return projetos.filter(
      (p) =>
        p.status === PROJETO_STATUS_APPROVED &&
        p.ano === periodo.ano &&
        p.semestre === periodo.semestre
    ) as DashboardProjectItem[]
  }, [projetos, editalVigente])

  const handleOpenPdf = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      const res = await getProjetoPdfMutation.mutateAsync({ projetoId })
      if (res?.url) {
        window.open(res.url, "_blank")
      }
    } catch {
      // Error handled by mutation
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  const isLoading = loadingProjetos || loadingEditais

  return (
    <PagesLayout
      title="Gerenciar Edital"
      subtitle="Preencha e revise os dados dos seus projetos (vagas voluntárias, datas e horários da seleção, pontos de prova e bibliografia) para publicação no Edital de Monitoria."
    >

      {/* Orientação ao Professor */}
      <div className="mb-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Instruções para Preenchimento do Edital
            </h4>
            <p className="text-muted-foreground">
              Antes da publicação do Edital, configure as informações de seleção dos seus projetos aprovados:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground pt-1">
              <li>
                <strong>Vagas Voluntárias:</strong> Indique o número de voluntários que deseja acolher no projeto.
              </li>
              <li>
                <strong>Data, Horário e Local da Seleção:</strong> Informe quando e onde será realizada a seleção (Item 6.2.3 do Edital).
              </li>
              <li>
                <strong>Pontos de Prova e Bibliografia:</strong> Personalize os conteúdos que serão cobrados dos alunos na prova de seleção (Item 6.3 do Edital).
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Meus Projetos Aprovados */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Meus projetos no EDITAL ({projetosAprovados.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground font-medium">Carregando projetos do edital...</span>
          </div>
        ) : projetosAprovados.length > 0 ? (
          <div className="space-y-6">
            {projetosAprovados.map((projeto) => {
              const disciplinaCodigo = projeto.disciplinas[0]?.codigo ?? "MON"
              const disciplinaNome = projeto.disciplinas[0]?.nome ?? projeto.titulo
              const bolsasCount = projeto.bolsasDisponibilizadas ?? 0
              const isPendente = !projeto.dadosEditalConfirmados

              return (
                <Collapsible key={projeto.id} defaultOpen={false}>
                  <Card className={`overflow-hidden shadow-sm ${isPendente ? "border-red-300 border-2" : "border-slate-200"}`}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className={`cursor-pointer border-b pb-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isPendente ? "bg-red-50/50 dark:bg-red-900/10" : "bg-slate-50 dark:bg-slate-900/50"}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="bg-white dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {disciplinaCodigo}
                              </Badge>
                              <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                                Aprovado pelo Admin
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {bolsasCount} vaga(s) com bolsa
                              </Badge>
                              {isPendente ? (
                                <Badge variant="destructive" className="text-xs">
                                  Pendente confirmação para o edital
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 text-xs border-green-200">
                                  Confirmado para o edital
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {disciplinaNome}
                            </CardTitle>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleOpenPdf(projeto.id) }}
                              disabled={loadingPdfProjetoId === projeto.id}
                            >
                              {loadingPdfProjetoId === projeto.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              Ver Proposta
                            </Button>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="p-6">
                        <DadosSelecaoSection projetoId={projeto.id} />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card text-card-foreground shadow-sm">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Nenhum projeto aprovado encontrado para este edital
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Você ainda não possui projetos aprovados no período vigente. Submeta novas propostas ou acompanhe o status de aprovação.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/home/professor/projetos/novo">
                <Button>Criar Novo Projeto</Button>
              </Link>
              <Link href="/home/professor/projetos">
                <Button variant="outline">Ver Meus Projetos</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PagesLayout>
  )
}
