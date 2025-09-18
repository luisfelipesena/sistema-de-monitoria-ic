"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MonitoriaFormData, projectFormSchema } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { PDFViewer } from "@react-pdf/renderer"
import {
  Eye,
  FileText,
  Layout,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Settings,
  Edit3,
  Save,
  RotateCcw,
  FileCheck
} from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Schema para template
const templateSchema = z.object({
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().int().positive().optional(),
  numeroSemanasDefault: z.number().int().positive().optional(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.array(z.string()).optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

// Componente memoizado para o PDFViewer
const PDFPreviewComponent = React.memo(({ data }: { data: MonitoriaFormData }) => {
  return (
    <div className="border rounded-lg bg-white">
      <div className="bg-green-50 border-b px-4 py-2">
        <p className="text-sm text-green-800 font-medium">
          ✅ Preview gerado com sucesso - Use "Atualizar Preview" para ver as alterações
        </p>
      </div>
      <div style={{ width: "100%", height: "800px" }}>
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <MonitoriaFormTemplate data={data} />
        </PDFViewer>
      </div>
    </div>
  )
})

type ProjetoFormData = z.infer<typeof projectFormSchema>

type WorkflowMode = "select" | "edit_template" | "create_project"

export default function NovoProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("select")
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [pdfKey, setPdfKey] = useState(0)
  const [publicoAlvoTipo, setPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao")
  const [publicoAlvoCustom, setPublicoAlvoCustom] = useState("")
  const [currentPdfData, setCurrentPdfData] = useState<MonitoriaFormData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [atividades, setAtividades] = useState<string[]>([
    "Auxiliar na elaboração de exercícios práticos de programação",
    "Apoiar estudantes em horários de plantão para esclarecimento de dúvidas",
    "Colaborar na revisão de códigos e debugging",
    "Ajudar na preparação de material didático complementar",
  ])

  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const { data: disciplinas } = api.discipline.getDisciplines.useQuery()
  const createProjeto = api.projeto.createProjeto.useMutation()
  const upsertTemplate = api.projetoTemplates.upsertTemplateByProfessor.useMutation()
  const apiUtils = api.useUtils()

  // Query para template da disciplina selecionada
  const { data: currentTemplate } = api.projetoTemplates.getTemplateByDisciplinaForProfessor.useQuery(
    { disciplinaId: selectedDisciplinaId! },
    { enabled: !!selectedDisciplinaId }
  )

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      departamentoId: 0,
      ano: new Date().getFullYear(),
      semestre: "SEMESTRE_1",
      tipoProposicao: "INDIVIDUAL",
      bolsasSolicitadas: 1,
      voluntariosSolicitados: 2,
      cargaHorariaSemana: 12,
      numeroSemanas: 17,
      publicoAlvo: "Estudantes de graduação",
      estimativaPessoasBenificiadas: 50,
      disciplinas: [],
    },
  })

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      tituloDefault: "",
      descricaoDefault: "",
      cargaHorariaSemanaDefault: 12,
      numeroSemanasDefault: 16,
      publicoAlvoDefault: "Estudantes de graduação",
      atividadesDefault: [],
    },
  })

  // Carregar template quando disciplina for selecionada
  useEffect(() => {
    if (currentTemplate && workflowMode === "edit_template") {
      templateForm.reset({
        tituloDefault: currentTemplate.tituloDefault || "",
        descricaoDefault: currentTemplate.descricaoDefault || "",
        cargaHorariaSemanaDefault: currentTemplate.cargaHorariaSemanaDefault || 12,
        numeroSemanasDefault: currentTemplate.numeroSemanasDefault || 16,
        publicoAlvoDefault: currentTemplate.publicoAlvoDefault || "Estudantes de graduação",
        atividadesDefault: currentTemplate.atividadesDefault || [],
      })

      if (currentTemplate.atividadesDefault?.length) {
        setAtividades(currentTemplate.atividadesDefault)
      }

      if (currentTemplate.publicoAlvoDefault === "Estudantes de graduação") {
        setPublicoAlvoTipo("estudantes_graduacao")
      } else if (currentTemplate.publicoAlvoDefault) {
        setPublicoAlvoTipo("outro")
        setPublicoAlvoCustom(currentTemplate.publicoAlvoDefault)
      }
    }
  }, [currentTemplate, workflowMode, templateForm])

  // Aplicar template ao formulário de projeto
  const applyTemplateToProject = () => {
    if (!currentTemplate) return

    const disciplina = disciplinas?.find(d => d.id === selectedDisciplinaId)
    if (!disciplina) return

    form.reset({
      titulo: currentTemplate.tituloDefault || "Monitoria de " + disciplina.nome,
      descricao: currentTemplate.descricaoDefault || "",
      departamentoId: disciplina.departamentoId,
      ano: new Date().getFullYear(),
      semestre: "SEMESTRE_1",
      tipoProposicao: "INDIVIDUAL",
      bolsasSolicitadas: 1,
      voluntariosSolicitados: 2,
      cargaHorariaSemana: currentTemplate.cargaHorariaSemanaDefault || 12,
      numeroSemanas: currentTemplate.numeroSemanasDefault || 16,
      publicoAlvo: currentTemplate.publicoAlvoDefault || "Estudantes de graduação",
      estimativaPessoasBenificiadas: 50,
      disciplinas: [selectedDisciplinaId!],
    })

    if (currentTemplate.atividadesDefault?.length) {
      setAtividades(currentTemplate.atividadesDefault)
    }

    if (currentTemplate.publicoAlvoDefault === "Estudantes de graduação") {
      setPublicoAlvoTipo("estudantes_graduacao")
    } else if (currentTemplate.publicoAlvoDefault) {
      setPublicoAlvoTipo("outro")
      setPublicoAlvoCustom(currentTemplate.publicoAlvoDefault)
    }
  }

  const handleDisciplinaSelect = (disciplinaId: string) => {
    setSelectedDisciplinaId(parseInt(disciplinaId))
    setWorkflowMode("select")
    setShowPreview(false)
  }

  const handleModeSelect = (mode: "edit_template" | "create_project") => {
    setWorkflowMode(mode)
    setShowPreview(false)

    if (mode === "create_project") {
      applyTemplateToProject()
    }
  }

  const handleBackToSelect = () => {
    setWorkflowMode("select")
    setSelectedDisciplinaId(null)
    setShowPreview(false)
  }

  // Atualiza o publicoAlvo baseado no tipo selecionado (template)
  useEffect(() => {
    if (workflowMode === "edit_template") {
      if (publicoAlvoTipo === "estudantes_graduacao") {
        templateForm.setValue("publicoAlvoDefault", "Estudantes de graduação")
      } else if (publicoAlvoTipo === "outro" && publicoAlvoCustom.trim()) {
        templateForm.setValue("publicoAlvoDefault", publicoAlvoCustom)
      }
    }
  }, [publicoAlvoTipo, publicoAlvoCustom, templateForm, workflowMode])

  // Atualiza o publicoAlvo baseado no tipo selecionado (projeto)
  useEffect(() => {
    if (workflowMode === "create_project") {
      if (publicoAlvoTipo === "estudantes_graduacao") {
        form.setValue("publicoAlvo", "Estudantes de graduação")
      } else if (publicoAlvoTipo === "outro" && publicoAlvoCustom.trim()) {
        form.setValue("publicoAlvo", publicoAlvoCustom)
      }
    }
  }, [publicoAlvoTipo, publicoAlvoCustom, form, workflowMode])

  const firstDisciplinaId = currentPdfData?.disciplinas?.[0]?.id
  const { data: disciplinaWithProfessor, isLoading: isLoadingProfessor } =
    api.discipline.getDisciplineWithProfessor.useQuery(
      { id: firstDisciplinaId! },
      { enabled: !!firstDisciplinaId && firstDisciplinaId !== 0 && showPreview }
    )

  const generatePdfData = useCallback(
    (formValues: ProjetoFormData | TemplateFormData, isTemplate = false): MonitoriaFormData | null => {
      if (!departamentos || !disciplinas || !selectedDisciplinaId) return null

      const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId)
      const departamento = departamentos.find((d) => d.id === disciplina?.departamentoId)

      if (!disciplina || !departamento) return null

      const professor = disciplinaWithProfessor?.professor

      if (isTemplate) {
        const templateValues = formValues as TemplateFormData
        return {
          titulo: templateValues.tituloDefault || "Template - " + disciplina.nome,
          descricao: templateValues.descricaoDefault || "",
          departamento: { id: departamento.id, nome: departamento.nome },
          coordenadorResponsavel: "Coordenador Responsável",
          professorResponsavel: professor ? {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero,
            cpf: professor.cpf,
            matriculaSiape: professor.matriculaSiape || undefined,
            regime: professor.regime,
            telefone: professor.telefone || undefined,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            emailInstitucional: professor.emailInstitucional,
          } : undefined,
          ano: new Date().getFullYear(),
          semestre: "SEMESTRE_1",
          tipoProposicao: "INDIVIDUAL",
          bolsasSolicitadas: 1,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: templateValues.cargaHorariaSemanaDefault || 12,
          numeroSemanas: templateValues.numeroSemanasDefault || 17,
          cargaHorariaTotal: 204,
          publicoAlvo: templateValues.publicoAlvoDefault || "Estudantes de graduação",
          estimativaPessoasBenificiadas: 50,
          disciplinas: [{ id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome }],
          atividades: atividades.filter((atividade) => atividade.trim() !== ""),
          user: {
            email: professor?.emailInstitucional || "professor@ufba.br",
            nomeCompleto: professor?.nomeCompleto || "Professor",
            role: "professor",
          },
        }
      } else {
        const projectValues = formValues as ProjetoFormData
        return {
          titulo: projectValues.titulo,
          descricao: projectValues.descricao,
          departamento: { id: departamento.id, nome: departamento.nome },
          coordenadorResponsavel: "Coordenador Responsável",
          professorResponsavel: professor ? {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero,
            cpf: professor.cpf,
            matriculaSiape: professor.matriculaSiape || undefined,
            regime: professor.regime,
            telefone: professor.telefone || undefined,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            emailInstitucional: professor.emailInstitucional,
          } : undefined,
          ano: projectValues.ano,
          semestre: projectValues.semestre,
          tipoProposicao: projectValues.tipoProposicao,
          professoresParticipantes: projectValues.professoresParticipantes,
          numeroMonitroresSolicitados: projectValues.professoresParticipantes ? 2 : undefined,
          bolsasSolicitadas: projectValues.bolsasSolicitadas || 0,
          voluntariosSolicitados: projectValues.voluntariosSolicitados || 0,
          cargaHorariaSemana: projectValues.cargaHorariaSemana,
          numeroSemanas: projectValues.numeroSemanas,
          cargaHorariaTotal: 204,
          publicoAlvo: projectValues.publicoAlvo,
          estimativaPessoasBenificiadas: projectValues.estimativaPessoasBenificiadas || 0,
          disciplinas: [{ id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome }],
          atividades: atividades.filter((atividade) => atividade.trim() !== ""),
          user: {
            email: professor?.emailInstitucional || "professor@ufba.br",
            nomeCompleto: professor?.nomeCompleto || "Professor",
            role: "professor",
          },
        }
      }
    },
    [departamentos, disciplinas, selectedDisciplinaId, disciplinaWithProfessor?.professor, atividades]
  )

  const handleAddAtividade = () => {
    setAtividades([...atividades, ""])
  }

  const handleRemoveAtividade = (index: number) => {
    const newAtividades = atividades.filter((_, i) => i !== index)
    setAtividades(newAtividades)

    // Atualizar template form se estiver no modo template
    if (workflowMode === "edit_template") {
      templateForm.setValue("atividadesDefault", newAtividades)
    }
  }

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)

    // Atualizar template form se estiver no modo template
    if (workflowMode === "edit_template") {
      templateForm.setValue("atividadesDefault", newAtividades)
    }
  }

  // Salvar template
  const onSubmitTemplate = async (data: TemplateFormData) => {
    if (!selectedDisciplinaId) return

    try {
      const templateData = {
        disciplinaId: selectedDisciplinaId,
        ...data,
        atividadesDefault: atividades.filter(a => a.trim() !== ""),
      }

      const result = await upsertTemplate.mutateAsync(templateData)

      toast({
        title: result.isNew ? "Template criado" : "Template atualizado",
        description: result.isNew
          ? "Template padrão criado com sucesso para esta disciplina."
          : "Template padrão atualizado com sucesso.",
      })

      await apiUtils.projetoTemplates.getTemplateByDisciplinaForProfessor.invalidate({
        disciplinaId: selectedDisciplinaId
      })

    } catch (error: any) {
      toast({
        title: "Erro ao salvar template",
        description: error.message || "Ocorreu um erro ao salvar o template.",
        variant: "destructive",
      })
    }
  }

  // Salvar projeto
  const onSubmitProject = async (data: ProjetoFormData) => {
    try {
      const atividadesFiltradas = atividades.filter((atividade) => atividade.trim() !== "")

      const projetoData = {
        ...data,
        disciplinaIds: data.disciplinas,
        atividades: atividadesFiltradas,
        status: 'DRAFT' as const,
      }

      const result = await createProjeto.mutateAsync(projetoData)

      toast({
        title: "Projeto criado",
        description: "Projeto criado com sucesso como rascunho.",
      })

      await apiUtils.projeto.getProjetos.invalidate()
      router.push("/home/professor/dashboard")

    } catch (error: any) {
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Ocorreu um erro ao criar o projeto.",
        variant: "destructive",
      })
    }
  }

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true)

    try {
      let pdfData: MonitoriaFormData | null = null

      if (workflowMode === "edit_template") {
        const templateValues = templateForm.getValues()
        pdfData = generatePdfData(templateValues, true)
      } else if (workflowMode === "create_project") {
        const formValues = form.getValues()
        pdfData = generatePdfData(formValues, false)
      }

      if (!pdfData) {
        toast({
          title: "Erro ao gerar preview",
          description: "Não foi possível gerar o preview com os dados fornecidos",
          variant: "destructive",
        })
        setIsGeneratingPreview(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 800))

      setCurrentPdfData(pdfData)
      setShowPreview(true)
      setHasChanges(false)
      setPdfKey((prev) => prev + 1)

    } catch (error) {
      toast({
        title: "Erro ao gerar preview",
        description: "Ocorreu um erro ao gerar o preview",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const isLoading = !departamentos || !disciplinas

  if (isLoading) {
    return (
      <PagesLayout title="Novo Projeto de Monitoria">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="mt-2">Carregando dados necessários...</p>
          </div>
        </div>
      </PagesLayout>
    )
  }

  // Tela de seleção inicial
  if (workflowMode === "select" && !selectedDisciplinaId) {
    return (
      <PagesLayout
        title="Novo projeto de monitoria"
        subtitle="Selecione a disciplina para continuar"
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Selecione a Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Primeiro, escolha a disciplina para a qual você deseja trabalhar com templates ou criar um projeto.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Disciplina</label>
                  <Select onValueChange={handleDisciplinaSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas?.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                          {disciplina.codigo} ({disciplina.turma}) - {disciplina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PagesLayout>
    )
  }

  // Tela de seleção de modo após disciplina escolhida
  if (workflowMode === "select" && selectedDisciplinaId) {
    const selectedDisciplina = disciplinas?.find(d => d.id === selectedDisciplinaId)

    return (
      <PagesLayout
        title="Novo projeto de monitoria"
        subtitle={`Disciplina: ${selectedDisciplina?.codigo} - ${selectedDisciplina?.nome}`}
        actions={
          <Button variant="outline" onClick={handleBackToSelect}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Escolher Outra Disciplina
          </Button>
        }
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                  onClick={() => handleModeSelect("edit_template")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Settings className="h-5 w-5" />
                  Editar Template Padrão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-amber-700">
                    Configure o template padrão para esta disciplina. Os dados do template serão utilizados
                    como base para novos projetos.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Edit3 className="h-4 w-4" />
                    <span className="font-medium">
                      {currentTemplate ? "Template já existe" : "Criar novo template"}
                    </span>
                  </div>
                  <ul className="text-xs text-amber-600 space-y-1 ml-6">
                    <li>• Define valores padrão para projetos</li>
                    <li>• Reutilizável para múltiplos projetos</li>
                    <li>• Facilita criação futura de projetos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => handleModeSelect("create_project")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <FileCheck className="h-5 w-5" />
                  Criar Projeto Específico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Crie um projeto específico para esta disciplina. O projeto será inicializado
                    com os dados do template padrão (se existir).
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">
                      Projeto para submissão
                    </span>
                  </div>
                  <ul className="text-xs text-blue-600 space-y-1 ml-6">
                    <li>• Baseado no template padrão</li>
                    <li>• Personalizável para necessidades específicas</li>
                    <li>• Será enviado para aprovação</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {currentTemplate && (
            <Card className="mt-6 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                  <FileCheck className="h-4 w-4" />
                  Template Padrão Existente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>Título:</strong> {currentTemplate.tituloDefault || "Não definido"}</p>
                  <p><strong>Carga Horária:</strong> {currentTemplate.cargaHorariaSemanaDefault || "Não definida"}h/semana</p>
                  <p><strong>Público Alvo:</strong> {currentTemplate.publicoAlvoDefault || "Não definido"}</p>
                  <p><strong>Atividades:</strong> {currentTemplate.atividadesDefault?.length || 0} definidas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PagesLayout>
    )
  }

  const selectedDisciplina = disciplinas?.find(d => d.id === selectedDisciplinaId)

  // Interface para edição de template
  if (workflowMode === "edit_template") {
    return (
      <PagesLayout
        title="Editar Template Padrão"
        subtitle={`Disciplina: ${selectedDisciplina?.codigo} - ${selectedDisciplina?.nome}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToSelect}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário do Template */}
          <div className="space-y-6">
            <Form {...templateForm}>
              <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-6">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Settings className="h-5 w-5" />
                      Configurações do Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={templateForm.control}
                      name="tituloDefault"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título Padrão</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Monitoria de Programação I"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="descricaoDefault"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Padrão</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição padrão para projetos desta disciplina..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={templateForm.control}
                        name="cargaHorariaSemanaDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carga Horária Semanal Padrão</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="numeroSemanasDefault"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Semanas Padrão</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={templateForm.control}
                      name="publicoAlvoDefault"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público Alvo Padrão</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <RadioGroup
                                value={publicoAlvoTipo}
                                onValueChange={(value: "estudantes_graduacao" | "outro") => {
                                  setPublicoAlvoTipo(value)
                                  if (value === "estudantes_graduacao") {
                                    field.onChange("Estudantes de graduação")
                                  }
                                }}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="estudantes_graduacao" id="estudantes_graduacao_template" />
                                  <label
                                    htmlFor="estudantes_graduacao_template"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Estudantes de graduação
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="outro" id="outro_template" />
                                  <label
                                    htmlFor="outro_template"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Outro
                                  </label>
                                </div>
                              </RadioGroup>
                              {publicoAlvoTipo === "outro" && (
                                <div className="mt-3">
                                  <Input
                                    placeholder="Descreva o público alvo específico"
                                    value={publicoAlvoCustom}
                                    onChange={(e) => {
                                      setPublicoAlvoCustom(e.target.value)
                                      field.onChange(e.target.value)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Atividades Padrão */}
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-800">Atividades Padrão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {atividades.map((atividade, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={`Atividade padrão ${index + 1}`}
                          value={atividade}
                          onChange={(e) => handleAtividadeChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAtividade(index)}
                          disabled={atividades.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddAtividade}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Atividade
                    </Button>
                  </CardContent>
                </Card>

                {/* Ações do Template */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={upsertTemplate.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {upsertTemplate.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando Template...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Template Padrão
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Preview do Template */}
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview do Template</h3>
                <Button
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isGeneratingPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Gerar Preview
                    </>
                  )}
                </Button>
              </div>

              {!showPreview ? (
                <div className="text-center py-12">
                  <Layout className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Preview do Template</h4>
                  <p className="text-gray-600 mb-4">
                    Visualize como ficará o template padrão para esta disciplina
                  </p>
                </div>
              ) : (
                <>
                  {isLoadingProfessor && selectedDisciplinaId ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                      <p>Carregando dados do professor...</p>
                    </div>
                  ) : currentPdfData ? (
                    <PDFPreviewComponent key={pdfKey} data={currentPdfData} />
                  ) : (
                    <div className="text-center py-8 text-red-500">
                      <p>Erro ao gerar preview do template.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PagesLayout>
    )
  }

  // Interface para criação de projeto (resto do código original adaptado)
  if (workflowMode === "create_project") {
    // Track changes when form values change
    React.useEffect(() => {
      const subscription = form.watch(() => {
        if (showPreview) {
          setHasChanges(true)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, showPreview])

    // Track changes when atividades change
    React.useEffect(() => {
      if (showPreview) {
        setHasChanges(true)
      }
    }, [atividades, showPreview])

    const handleUpdatePreview = async () => {
      setIsGeneratingPreview(true)

      try {
        const formValues = form.getValues()
        const pdfData = generatePdfData(formValues, false)

        if (!pdfData) {
          toast({
            title: "Erro ao atualizar preview",
            description: "Não foi possível atualizar o preview com os dados fornecidos",
            variant: "destructive",
          })
          setIsGeneratingPreview(false)
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 500))

        setCurrentPdfData(pdfData)
        setHasChanges(false)
        setPdfKey((prev) => prev + 1)
      } catch (error) {
        toast({
          title: "Erro ao atualizar preview",
          description: "Ocorreu um erro ao atualizar o preview",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingPreview(false)
      }
    }

    return (
      <PagesLayout
        title="Criar Projeto Específico"
        subtitle={`Disciplina: ${selectedDisciplina?.codigo} - ${selectedDisciplina?.nome}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackToSelect}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            {currentTemplate && (
              <Button
                variant="outline"
                onClick={() => {
                  applyTemplateToProject()
                  toast({
                    title: "Template aplicado",
                    description: "Os dados do template foram aplicados ao projeto.",
                  })
                }}
              >
                <Layout className="h-4 w-4 mr-2" />
                Reaplicar Template
              </Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário do Projeto */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitProject)} className="space-y-6">
                {/* Identificação do Projeto */}
                <Card>
                  <CardHeader>
                    <CardTitle>Identificação do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Projeto</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o título do projeto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição/Objetivos</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva os objetivos e justificativa do projeto"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ano"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={2024}
                                max={2030}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="semestre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semestre</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                                <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipoProposicao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Proposição</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                <SelectItem value="COLETIVA">Coletiva</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Campo condicional para professores participantes */}
                    {form.watch("tipoProposicao") === "COLETIVA" && (
                      <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Projeto Coletivo</h4>
                        <FormField
                          control={form.control}
                          name="professoresParticipantes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professores Participantes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ex: 2 - Professor João Silva e Professora Maria Santos"
                                  rows={2}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-sm text-blue-600">
                                Informe o número e nome dos professores participantes do projeto coletivo
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detalhes do Projeto */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cargaHorariaSemana"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carga Horária Semanal (horas)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numeroSemanas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Semanas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="publicoAlvo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público Alvo</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <RadioGroup
                                value={publicoAlvoTipo}
                                onValueChange={(value: "estudantes_graduacao" | "outro") => {
                                  setPublicoAlvoTipo(value)
                                  if (value === "estudantes_graduacao") {
                                    field.onChange("Estudantes de graduação")
                                  }
                                }}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="estudantes_graduacao" id="estudantes_graduacao_project" />
                                  <label
                                    htmlFor="estudantes_graduacao_project"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Estudantes de graduação
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="outro" id="outro_project" />
                                  <label
                                    htmlFor="outro_project"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Outro
                                  </label>
                                </div>
                              </RadioGroup>
                              {publicoAlvoTipo === "outro" && (
                                <div className="mt-3">
                                  <Input
                                    placeholder="Descreva o público alvo específico"
                                    value={publicoAlvoCustom}
                                    onChange={(e) => {
                                      setPublicoAlvoCustom(e.target.value)
                                      field.onChange(e.target.value)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimativaPessoasBenificiadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimativa de Pessoas Beneficiadas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Vagas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vagas Solicitadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bolsasSolicitadas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bolsistas Solicitados</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="voluntariosSolicitados"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voluntários Solicitados</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Atividades */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atividades do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {atividades.map((atividade, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={`Atividade ${index + 1}`}
                          value={atividade}
                          onChange={(e) => handleAtividadeChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAtividade(index)}
                          disabled={atividades.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddAtividade} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Atividade
                    </Button>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={createProjeto.isPending}
                    className="bg-[#1B2A50] text-white hover:bg-[#24376c]"
                  >
                    {createProjeto.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Rascunho"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* PDF Preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview do Documento</h3>
                <div className="flex gap-2">
                  {showPreview && hasChanges && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpdatePreview}
                      disabled={isGeneratingPreview}
                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    >
                      {isGeneratingPreview ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Atualizar Preview
                        </>
                      )}
                    </Button>
                  )}
                  {showPreview && (
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                      Ocultar Preview
                    </Button>
                  )}
                </div>
              </div>

              {!showPreview ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Gere o Preview do Documento</h4>
                  <p className="text-gray-600 mb-4">
                    Visualize como ficará o formulário oficial de monitoria antes de salvar
                  </p>

                  <Button
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isGeneratingPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando Preview...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Gerar Preview do Documento
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 mt-3">
                    O preview será gerado com base nos dados preenchidos no formulário
                  </p>
                </div>
              ) : (
                <>
                  {hasChanges && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 text-amber-600" />
                        <p className="text-sm text-amber-800 font-medium">
                          O formulário foi alterado. Clique em "Atualizar Preview" para ver as mudanças.
                        </p>
                      </div>
                    </div>
                  )}

                  {isLoadingProfessor && firstDisciplinaId && firstDisciplinaId !== 0 ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                      <p>Carregando dados do professor...</p>
                    </div>
                  ) : currentPdfData ? (
                    <PDFPreviewComponent key={pdfKey} data={currentPdfData} />
                  ) : (
                    <div className="text-center py-8 text-red-500">
                      <p>Erro ao gerar preview. Verifique se todos os campos obrigatórios estão preenchidos.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PagesLayout>
    )
  }

  return null
}