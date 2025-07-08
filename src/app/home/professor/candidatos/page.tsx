"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { QuickEvaluation } from "@/types"
import { api } from "@/utils/api"
import { CheckCircle, Clock, GraduationCap, Star, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"

function ProjectApplicationsContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projetoId")
  const { toast } = useToast()

  const { data: projetos } = api.projeto.getProjetos.useQuery()
  const { data: inscricoes, isLoading: loadingInscricoes } = api.inscricao.getInscricoesProjeto.useQuery(
    { projetoId: parseInt(projectId || "0") },
    { enabled: !!projectId }
  )
  const avaliarCandidato = api.inscricao.avaliarCandidato.useMutation()

  const [quickEvaluations, setQuickEvaluations] = useState<Record<number, QuickEvaluation>>({})

  // Filter projects that are approved and belong to the current professor
  const myApprovedProjects = useMemo(() => {
    if (!projetos) return []
    return projetos.filter((projeto) => projeto.status === "APPROVED")
  }, [projetos])

  const selectedProject = myApprovedProjects.find((p) => p.id === parseInt(projectId || "0"))

  const candidatesByType = useMemo(() => {
    if (!inscricoes) return { scholarship: [], volunteer: [] }

    const scholarship = inscricoes.filter((c) => c.tipoVagaPretendida === "BOLSISTA" || c.tipoVagaPretendida === "ANY")

    const volunteer = inscricoes.filter((c) => c.tipoVagaPretendida === "VOLUNTARIO" || c.tipoVagaPretendida === "ANY")

    return { scholarship, volunteer }
  }, [inscricoes])

  const handleQuickEvaluation = (inscricaoId: number, field: keyof QuickEvaluation, value: any) => {
    setQuickEvaluations((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        [field]: value,
      },
    }))
  }

  const handleSaveEvaluation = async (inscricaoId: number) => {
    const evaluation = quickEvaluations[inscricaoId]
    if (!evaluation || !evaluation.rating) {
      toast({
        title: "Erro",
        description: "Avaliação é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      await avaliarCandidato.mutateAsync({
        inscricaoId,
        notaDisciplina: evaluation.rating * 2, // Convert 1-5 rating to 0-10 scale
        notaSelecao: evaluation.rating * 2,
        coeficienteRendimento: evaluation.rating * 2,
        feedbackProfessor: evaluation.notes,
      })

      toast({
        title: "Sucesso",
        description: "Candidato avaliado com sucesso!",
      })

      // Remove from quick evaluations
      setQuickEvaluations((prev) => {
        const newEvaluations = { ...prev }
        delete newEvaluations[inscricaoId]
        return newEvaluations
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao avaliar candidato",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="secondary">Aguardando Avaliação</Badge>
      case "SELECTED_BOLSISTA":
        return (
          <Badge variant="default" className="bg-green-600">
            Selecionado (Bolsista)
          </Badge>
        )
      case "SELECTED_VOLUNTARIO":
        return (
          <Badge variant="default" className="bg-blue-600">
            Selecionado (Voluntário)
          </Badge>
        )
      case "ACCEPTED_BOLSISTA":
        return (
          <Badge variant="default" className="bg-green-800">
            Aceito (Bolsista)
          </Badge>
        )
      case "ACCEPTED_VOLUNTARIO":
        return (
          <Badge variant="default" className="bg-blue-800">
            Aceito (Voluntário)
          </Badge>
        )
      case "REJECTED_BY_PROFESSOR":
        return <Badge variant="destructive">Rejeitado</Badge>
      case "REJECTED_BY_STUDENT":
        return <Badge variant="outline">Recusado pelo Estudante</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderCandidateCard = (candidate: any) => {
    const evaluation = quickEvaluations[candidate.id]
    const hasExistingEvaluation = candidate.notaFinal !== null

    return (
      <Card key={candidate.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{candidate.aluno.nomeCompleto}</CardTitle>
              <p className="text-sm text-gray-600">
                Matrícula: {candidate.aluno.matricula} • CR: {candidate.aluno.cr}
              </p>
              <p className="text-sm text-gray-500">Email: {candidate.aluno.user.email}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(candidate.status)}
              {hasExistingEvaluation && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Nota: {candidate.notaFinal?.toFixed(1) || "N/A"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {!hasExistingEvaluation && candidate.status === "SUBMITTED" && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Avaliação Rápida (1-5 estrelas)</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleQuickEvaluation(candidate.id, "rating", rating)}
                      className={`p-1 ${evaluation?.rating >= rating ? "text-yellow-500" : "text-gray-300"}`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Observações</Label>
                <Textarea
                  placeholder="Observações sobre o candidato..."
                  value={evaluation?.notes || ""}
                  onChange={(e) => handleQuickEvaluation(candidate.id, "notes", e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => handleSaveEvaluation(candidate.id)}
                  disabled={!evaluation?.rating || avaliarCandidato.isPending}
                  className="w-full"
                >
                  {avaliarCandidato.isPending ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Avaliar
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {hasExistingEvaluation && (
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600">
              <strong>Observações:</strong> {candidate.feedbackProfessor || "Nenhuma observação"}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (!projectId) {
    return (
      <PagesLayout title="Gerenciar Candidaturas">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum projeto selecionado. Acesse esta página através do dashboard.</p>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Gerenciar Candidaturas"
      subtitle="Avalie e selecione candidatos para seus projetos de monitoria"
    >
      <div className="space-y-6">
        {/* Project Overview */}
        {selectedProject && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total de Candidatos</p>
                    <p className="text-2xl font-bold">{inscricoes?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Bolsas Disponíveis</p>
                    <p className="text-2xl font-bold">{selectedProject.bolsasDisponibilizadas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Vagas Voluntárias</p>
                    <p className="text-2xl font-bold">{selectedProject.voluntariosSolicitados || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Avaliados</p>
                    <p className="text-2xl font-bold">{inscricoes?.filter((i) => i.notaFinal !== null).length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Candidates */}
        {loadingInscricoes ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Carregando candidatos...</p>
          </div>
        ) : (
          <Tabs defaultValue="scholarship" className="space-y-4">
            <TabsList>
              <TabsTrigger value="scholarship">Candidatos a Bolsa ({candidatesByType.scholarship.length})</TabsTrigger>
              <TabsTrigger value="volunteer">Candidatos Voluntários ({candidatesByType.volunteer.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="scholarship" className="space-y-4">
              {candidatesByType.scholarship.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum candidato a bolsa</h3>
                    <p className="text-gray-500">Ainda não há candidatos interessados em bolsas para este projeto.</p>
                  </CardContent>
                </Card>
              ) : (
                candidatesByType.scholarship.map((candidate) => renderCandidateCard(candidate))
              )}
            </TabsContent>

            <TabsContent value="volunteer" className="space-y-4">
              {candidatesByType.volunteer.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum candidato voluntário</h3>
                    <p className="text-gray-500">
                      Ainda não há candidatos interessados em vagas voluntárias para este projeto.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                candidatesByType.volunteer.map((candidate) => renderCandidateCard(candidate))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PagesLayout>
  )
}

export default function ProjectApplicationsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProjectApplicationsContent />
    </Suspense>
  )
}
