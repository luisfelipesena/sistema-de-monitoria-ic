"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/utils/api"
import { BookOpen, Building, Calendar, CheckCircle, Clock, Info, Loader2, Plus, Send, User } from "lucide-react"
import * as React from "react"

export default function StudentInscricaoPage() {
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null)
  const [applicationStep, setApplicationStep] = React.useState<"selection" | "form" | "confirmation">("selection")

  const { data: availableProjects, isLoading: projectsLoading } = api.projeto.list.useQuery({
    status: ["APPROVED"],
  })

  // Assuming an endpoint to get the currently active period.
  // This is mocked for now as the endpoint doesn't exist yet.
  const { data: activePeriod, isLoading: periodLoading } = api.periodoInscricao.getActive.useQuery()

  const inscricaoMutation = api.inscricao.create.useMutation()

  const [applicationForm, setApplicationForm] = React.useState({
    tipo: "bolsista" as "bolsista" | "voluntario",
    motivacao: "",
    experiencia: "",
    disponibilidade: "",
    telefone: "",
    semestre: "",
    cra: "",
  })

  const handleProjectSelect = (projectId: number) => {
    setSelectedProjectId(projectId)
    setApplicationStep("form")
  }

  const handleFormSubmit = () => {
    if (!selectedProjectId) return

    inscricaoMutation.mutate(
      {
        projetoId: selectedProjectId,
        tipoVagaPretendida: applicationForm.tipo.toUpperCase() as any,
        // ... pass other form fields
      },
      {
        onSuccess: () => {
          setApplicationStep("confirmation")
        },
        onError: (error) => {
          console.error("Erro na inscrição", error)
          // toast.error("Falha ao enviar inscrição.")
        },
      }
    )
  }

  const selectedProjectData = availableProjects?.find((p) => p.id === selectedProjectId)

  if (projectsLoading || periodLoading) {
    return (
      <PagesLayout title="Inscrição em Monitoria" subtitle="Selecione um projeto para se candidatar">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </PagesLayout>
    )
  }

  const projectSelectionActions = (
    <Button disabled className="opacity-50">
      <Clock className="w-4 h-4 mr-2" />
      {/* {activePeriod.daysRemaining} dias restantes */}
      {activePeriod ? `Faltam ${activePeriod.daysRemaining} dias` : "Nenhum período ativo"}
    </Button>
  )

  if (applicationStep === "confirmation") {
    return (
      <PagesLayout title="Inscrição Realizada" subtitle="Sua candidatura foi enviada com sucesso">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Inscrição Confirmada!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium mb-2">{selectedProjectData?.titulo}</h3>
                <p className="text-sm text-muted-foreground">{selectedProjectData?.professorResponsavelNome}</p>
                <Badge variant={applicationForm.tipo === "bolsista" ? "success" : "secondary"} className="mt-2">
                  {applicationForm.tipo === "bolsista" ? "Candidato a Bolsista" : "Candidato a Voluntário"}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Sua candidatura foi registrada e está aguardando avaliação do professor.</p>
                <p>Você receberá uma notificação quando o resultado for divulgado.</p>
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => setApplicationStep("selection")}>
                  Nova Inscrição
                </Button>
                <Button>Ver Minhas Candidaturas</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PagesLayout>
    )
  }

  if (applicationStep === "form" && selectedProjectData) {
    return (
      <PagesLayout
        title="Formulário de Inscrição"
        subtitle={`Candidatura para ${selectedProjectData.titulo}`}
        actions={
          <Button variant="outline" onClick={() => setApplicationStep("selection")}>
            Voltar à Seleção
          </Button>
        }
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedProjectData.titulo}</h3>
                <p className="text-sm text-muted-foreground">{selectedProjectData.professorResponsavelNome}</p>
                <p className="text-sm text-muted-foreground">{selectedProjectData.departamentoNome}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disciplina:</span>
                  <span className="font-medium">{/* {selectedProjectData.disciplina} */}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Carga Horária:</span>
                  <span className="font-medium">{selectedProjectData.cargaHoraria}h/semana</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bolsas:</span>
                  <span className="font-medium">{selectedProjectData.bolsas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Voluntários:</span>
                  <span className="font-medium">{selectedProjectData.voluntarios}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Requisitos:</h4>
                <p className="text-sm text-muted-foreground">{selectedProjectData.requisitos}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Atividades:</h4>
                <p className="text-sm text-muted-foreground">
                  {/* Atividades not available in list view yet */}
                  Auxiliar nas aulas práticas, tirar dúvidas dos alunos, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dados da Candidatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de candidatura */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de candidatura</label>
                <div className="flex gap-4">
                  {selectedProjectData.bolsas > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="bolsista"
                        checked={applicationForm.tipo === "bolsista"}
                        onChange={(e) => setApplicationForm({ ...applicationForm, tipo: e.target.value as "bolsista" })}
                        className="text-blue-600"
                      />
                      <Badge variant="success">Bolsista</Badge>
                    </label>
                  )}
                  {selectedProjectData.voluntarios > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="voluntario"
                        checked={applicationForm.tipo === "voluntario"}
                        onChange={(e) =>
                          setApplicationForm({ ...applicationForm, tipo: e.target.value as "voluntario" })
                        }
                        className="text-blue-600"
                      />
                      <Badge variant="secondary">Voluntário</Badge>
                    </label>
                  )}
                </div>
              </div>

              {/* Dados pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Telefone</label>
                  <input
                    type="tel"
                    value={applicationForm.telefone}
                    onChange={(e) => setApplicationForm({ ...applicationForm, telefone: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="(71) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Semestre Atual</label>
                  <input
                    type="text"
                    value={applicationForm.semestre}
                    onChange={(e) => setApplicationForm({ ...applicationForm, semestre: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: 5º semestre"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">CRA (Coeficiente de Rendimento Acadêmico)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={applicationForm.cra}
                  onChange={(e) => setApplicationForm({ ...applicationForm, cra: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="0.0"
                />
              </div>

              {/* Motivação */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Motivação para ser monitor
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applicationForm.motivacao}
                  onChange={(e) => setApplicationForm({ ...applicationForm, motivacao: e.target.value })}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Descreva por que você deseja ser monitor desta disciplina..."
                  required
                />
              </div>

              {/* Experiência */}
              <div>
                <label className="text-sm font-medium mb-2 block">Experiência prévia</label>
                <textarea
                  value={applicationForm.experiencia}
                  onChange={(e) => setApplicationForm({ ...applicationForm, experiencia: e.target.value })}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Descreva experiências relevantes (monitorias anteriores, projetos, etc.)"
                />
              </div>

              {/* Disponibilidade */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Disponibilidade de horários
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applicationForm.disponibilidade}
                  onChange={(e) => setApplicationForm({ ...applicationForm, disponibilidade: e.target.value })}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Informe seus horários livres na semana..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setApplicationStep("selection")}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleFormSubmit}
                  disabled={
                    inscricaoMutation.isPending || !applicationForm.motivacao || !applicationForm.disponibilidade
                  }
                >
                  {inscricaoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Candidatura
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Inscrição em Monitoria"
      subtitle="Selecione um projeto para se candidatar"
      actions={projectSelectionActions}
    >
      <div className="space-y-6">
        {/* Period Alert */}
        {activePeriod && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {activePeriod.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700">
                    Período de inscrições ativo até {new Date(activePeriod.dataFim).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-blue-600">Restam {activePeriod.daysRemaining} dias para se inscrever</p>
                </div>
                <Badge variant="success">ABERTO</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Como se candidatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-sm font-medium">Escolha um projeto</p>
                <p className="text-xs text-muted-foreground">Analise os requisitos e atividades</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <p className="text-sm font-medium">Preencha o formulário</p>
                <p className="text-xs text-muted-foreground">Informe seus dados e motivação</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <p className="text-sm font-medium">Aguarde resultado</p>
                <p className="text-xs text-muted-foreground">Professor avaliará sua candidatura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Projects */}
        <div className="grid gap-6">
          {availableProjects?.map((project) => {
            const totalVagas = (project.bolsas || 0) + (project.voluntarios || 0)
            const inscritos = (project.id % 10) + 5 // Mocked inscritos
            return (
              <Card key={project.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{project.titulo}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {project.professorResponsavelNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {project.departamentoNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {/* {project.disciplina} */}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {project.bolsas > 0 && <Badge variant="success">{project.bolsas} Bolsa(s)</Badge>}
                      {project.voluntarios > 0 && (
                        <Badge variant="secondary">{project.voluntarios} Voluntário(s)</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{totalVagas}</div>
                      <p className="text-sm text-muted-foreground">Vagas Totais</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{inscritos}</div>
                      <p className="text-sm text-muted-foreground">Candidatos</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{project.cargaHoraria}h</div>
                      <p className="text-sm text-muted-foreground">Carga Horária</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Requisitos:</h4>
                      <p className="text-sm text-muted-foreground">{project.requisitos}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Atividades:</h4>
                      <p className="text-sm text-muted-foreground">
                        {/* Atividades not available in list view yet */}
                        Auxiliar nas aulas práticas, tirar dúvidas dos alunos, etc.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Competitividade: {totalVagas > 0 ? (inscritos / totalVagas).toFixed(1) : 0}:1</span>
                    </div>
                    <Button onClick={() => handleProjectSelect(project.id)} disabled={!activePeriod}>
                      <Plus className="w-4 h-4 mr-2" />
                      Candidatar-se
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </PagesLayout>
  )
}
