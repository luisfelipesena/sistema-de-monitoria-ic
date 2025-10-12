"use client"

import { DisciplineSelector } from "@/components/features/projects/DisciplineSelector"
import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { PreviewSection } from "@/components/features/projects/PreviewSection"
import { ProjectForm } from "@/components/features/projects/ProjectForm"
import { TemplateForm } from "@/components/features/projects/TemplateForm"
import { TemplateRequiredAlert } from "@/components/features/projects/TemplateRequiredAlert"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { MonitoriaFormData, projectFormSchema } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { PDFViewer } from "@react-pdf/renderer"
import { Edit3, Loader2, RotateCcw } from "lucide-react"
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
type ProjetoFormData = z.infer<typeof projectFormSchema>

// Componente memoizado para o PDFViewer
const PDFPreviewComponent = React.memo(({ data }: { data: MonitoriaFormData }) => {
  return (
    <div className="border rounded-lg bg-white">
      <div style={{ width: "100%", height: "800px" }}>
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <MonitoriaFormTemplate data={data} />
        </PDFViewer>
      </div>
    </div>
  )
})

PDFPreviewComponent.displayName = "PDFPreviewComponent"

export default function NovoProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()

  // Estados
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number | null>(null)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [pdfKey, setPdfKey] = useState(0)
  const [publicoAlvoTipo, setPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao")
  const [publicoAlvoCustom, setPublicoAlvoCustom] = useState("")
  const [currentPdfData, setCurrentPdfData] = useState<MonitoriaFormData | null>(null)
  const [atividades, setAtividades] = useState<string[]>([
    "Auxiliar na elaboração de exercícios práticos de programação",
    "Apoiar estudantes em horários de plantão para esclarecimento de dúvidas",
    "Colaborar na revisão de códigos e debugging",
    "Ajudar na preparação de material didático complementar",
  ])

  // Queries
  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const { data: disciplinas } = api.discipline.getDepartmentDisciplines.useQuery()
  const { data: currentTemplate } = api.projetoTemplates.getTemplateByDisciplinaForProfessor.useQuery(
    { disciplinaId: selectedDisciplinaId! },
    { enabled: !!selectedDisciplinaId }
  )
  const { data: currentUser, isLoading: isLoadingUser } = api.me.getMe.useQuery()

  // Mutations
  const createProjeto = api.projeto.createProjeto.useMutation()
  const upsertTemplate = api.projetoTemplates.upsertTemplateByProfessor.useMutation()
  const apiUtils = api.useUtils()

  // Forms
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

  // Effects
  useEffect(() => {
    if (currentTemplate && isEditingTemplate) {
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
  }, [currentTemplate, isEditingTemplate, templateForm])

  useEffect(() => {
    if (selectedDisciplinaId && currentTemplate && !isEditingTemplate) {
      const disciplina = disciplinas?.find((d) => d.id === selectedDisciplinaId)
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
        disciplinas: [selectedDisciplinaId],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisciplinaId, currentTemplate, disciplinas, isEditingTemplate])

  useEffect(() => {
    if (isEditingTemplate) {
      if (publicoAlvoTipo === "estudantes_graduacao") {
        templateForm.setValue("publicoAlvoDefault", "Estudantes de graduação")
      } else if (publicoAlvoTipo === "outro" && publicoAlvoCustom.trim()) {
        templateForm.setValue("publicoAlvoDefault", publicoAlvoCustom)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicoAlvoTipo, publicoAlvoCustom, isEditingTemplate])

  useEffect(() => {
    if (!isEditingTemplate) {
      if (publicoAlvoTipo === "estudantes_graduacao") {
        form.setValue("publicoAlvo", "Estudantes de graduação")
      } else if (publicoAlvoTipo === "outro" && publicoAlvoCustom.trim()) {
        form.setValue("publicoAlvo", publicoAlvoCustom)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicoAlvoTipo, publicoAlvoCustom, isEditingTemplate])

  // Callbacks e handlers
  const generatePdfData = useCallback(
    (formValues: ProjetoFormData | TemplateFormData, isTemplate = false): MonitoriaFormData | null => {
      if (!departamentos || !disciplinas || !selectedDisciplinaId) return null

      const disciplina = disciplinas.find((d) => d.id === selectedDisciplinaId)
      const departamento = departamentos.find((d) => d.id === disciplina?.departamentoId)

      if (!disciplina || !departamento) return null

      const professor = currentUser?.professor

      if (isTemplate) {
        const templateValues = formValues as TemplateFormData
        return {
          titulo: templateValues.tituloDefault || "Template - " + disciplina.nome,
          descricao: templateValues.descricaoDefault || "",
          departamento: { id: departamento.id, nome: departamento.nome },
          coordenadorResponsavel: "Coordenador Responsável",
          professorResponsavel: professor
            ? {
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
              }
            : undefined,
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
          professorResponsavel: professor
            ? {
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
              }
            : undefined,
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
    [departamentos, disciplinas, selectedDisciplinaId, currentUser?.professor, atividades]
  )

  const handleDisciplinaSelect = (disciplinaId: string) => {
    setSelectedDisciplinaId(parseInt(disciplinaId))
    setIsEditingTemplate(false)
    setShowPreview(false)
  }

  const handleBackToSelect = () => {
    setSelectedDisciplinaId(null)
    setIsEditingTemplate(false)
    setShowPreview(false)
  }

  const handleAddAtividade = () => {
    setAtividades([...atividades, ""])
  }

  const handleRemoveAtividade = (index: number) => {
    const newAtividades = atividades.filter((_, i) => i !== index)
    setAtividades(newAtividades)

    if (isEditingTemplate) {
      templateForm.setValue("atividadesDefault", newAtividades)
    }
  }

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)

    if (isEditingTemplate) {
      templateForm.setValue("atividadesDefault", newAtividades)
    }
  }

  const onSubmitTemplate = async (data: TemplateFormData) => {
    if (!selectedDisciplinaId) return

    try {
      const templateData = {
        disciplinaId: selectedDisciplinaId,
        ...data,
        atividadesDefault: atividades.filter((a) => a.trim() !== ""),
      }

      const result = await upsertTemplate.mutateAsync(templateData)

      toast({
        title: result.isNew ? "Template criado" : "Template atualizado",
        description: result.isNew
          ? "Template padrão criado com sucesso para esta disciplina."
          : "Template padrão atualizado com sucesso.",
      })

      await apiUtils.projetoTemplates.getTemplateByDisciplinaForProfessor.invalidate({
        disciplinaId: selectedDisciplinaId,
      })

      setIsEditingTemplate(false)
    } catch (error: any) {
      toast({
        title: "Erro ao salvar template",
        description: error.message || "Ocorreu um erro ao salvar o template.",
        variant: "destructive",
      })
    }
  }

  const onSubmitProject = async (data: ProjetoFormData) => {
    if (!currentTemplate) {
      toast({
        title: "Template obrigatório",
        description: "Você precisa criar um template padrão antes de criar projetos para esta disciplina.",
        variant: "destructive",
      })
      return
    }

    try {
      const atividadesFiltradas = atividades.filter((atividade) => atividade.trim() !== "")

      const projetoData = {
        ...data,
        disciplinaIds: data.disciplinas,
        atividades: atividadesFiltradas,
        status: "DRAFT" as const,
      }

      await createProjeto.mutateAsync(projetoData)

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

      if (isEditingTemplate) {
        const templateValues = templateForm.getValues()
        pdfData = generatePdfData(templateValues, true)
      } else {
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
  if (!selectedDisciplinaId) {
    return (
      <PagesLayout title="Novo projeto de monitoria" subtitle="Selecione a disciplina para continuar">
        <div>
          <DisciplineSelector disciplines={disciplinas} onSelect={handleDisciplinaSelect} />
        </div>
      </PagesLayout>
    )
  }

  const selectedDisciplina = disciplinas?.find((d) => d.id === selectedDisciplinaId)

  // Tela principal de edição
  return (
    <PagesLayout
      title={isEditingTemplate ? "Editar Template Padrão" : "Criar Projeto de Monitoria"}
      subtitle={`Disciplina: ${selectedDisciplina?.codigo} - ${selectedDisciplina?.nome}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackToSelect}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Escolher Outra Disciplina
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário (Esquerda) */}
        <div className="space-y-6">
          {!currentTemplate && !isEditingTemplate ? (
            <TemplateRequiredAlert onCreateTemplate={() => setIsEditingTemplate(true)} variant="form" />
          ) : isEditingTemplate ? (
            <TemplateForm
              form={templateForm}
              onSubmit={onSubmitTemplate}
              onCancel={() => setIsEditingTemplate(false)}
              isSubmitting={upsertTemplate.isPending}
              atividades={atividades}
              onAtividadeChange={handleAtividadeChange}
              onAddAtividade={handleAddAtividade}
              onRemoveAtividade={handleRemoveAtividade}
              publicoAlvoTipo={publicoAlvoTipo}
              setPublicoAlvoTipo={setPublicoAlvoTipo}
              publicoAlvoCustom={publicoAlvoCustom}
              setPublicoAlvoCustom={setPublicoAlvoCustom}
            />
          ) : (
            <ProjectForm
              form={form}
              onSubmit={onSubmitProject}
              isSubmitting={createProjeto.isPending}
              atividades={atividades}
              onAtividadeChange={handleAtividadeChange}
              onAddAtividade={handleAddAtividade}
              onRemoveAtividade={handleRemoveAtividade}
              publicoAlvoTipo={publicoAlvoTipo}
              setPublicoAlvoTipo={setPublicoAlvoTipo}
              publicoAlvoCustom={publicoAlvoCustom}
              setPublicoAlvoCustom={setPublicoAlvoCustom}
            />
          )}
        </div>

        {/* Preview (Direita) */}
        <div className="space-y-4">
          {!currentTemplate && !isEditingTemplate ? (
            <TemplateRequiredAlert onCreateTemplate={() => setIsEditingTemplate(true)} variant="sidebar" />
          ) : (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditingTemplate ? "Preview do Template" : "Preview do Documento"}
                </h3>
                <div className="flex gap-2">
                  {!isEditingTemplate && currentTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingTemplate(true)}
                      className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar Template
                    </Button>
                  )}
                </div>
              </div>

              <PreviewSection
                showPreview={showPreview}
                isGenerating={isGeneratingPreview}
                isLoadingUser={isLoadingUser}
                onGeneratePreview={handleGeneratePreview}
                onUpdatePreview={showPreview ? handleUpdatePreview : undefined}
              >
                {currentPdfData && <PDFPreviewComponent key={pdfKey} data={currentPdfData} />}
              </PreviewSection>
            </div>
          )}
        </div>
      </div>
    </PagesLayout>
  )
}