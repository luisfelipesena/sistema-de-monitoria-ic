"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { PreviewSection } from "@/components/features/projects/PreviewSection"
import { ProjectForm } from "@/components/features/projects/ProjectForm"
import { TemplateForm } from "@/components/features/projects/TemplateForm"
import { TemplateRequiredAlert } from "@/components/features/projects/TemplateRequiredAlert"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  formatErrorResponse,
  MonitoriaFormData,
  projectFormSchema,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_PENDING_SIGNATURE,
  SEMESTRE_1,
  TIPO_PROPOSICAO_INDIVIDUAL,
} from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { PDFViewer } from "@react-pdf/renderer"
import { ArrowLeft, Edit3, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type ProjetoFormData = z.infer<typeof projectFormSchema>

const templateSchema = z.object({
  tituloDefault: z.string().optional(),
  descricaoDefault: z.string().optional(),
  cargaHorariaSemanaDefault: z.number().int().positive().optional(),
  numeroSemanasDefault: z.number().int().positive().optional(),
  publicoAlvoDefault: z.string().optional(),
  atividadesDefault: z.array(z.string()).optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

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

const DEFAULT_ATIVIDADES = [
  "Auxiliar na elaboração de exercícios práticos",
  "Apoiar estudantes em horários de plantão para esclarecimento de dúvidas",
  "Colaborar na revisão de trabalhos",
  "Ajudar na preparação de material didático complementar",
]

export default function EditProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const projectId = parseInt(params.id as string)

  const [atividades, setAtividades] = useState<string[]>([])
  const [publicoAlvoTipo, setPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao")
  const [publicoAlvoCustom, setPublicoAlvoCustom] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [pdfKey, setPdfKey] = useState(0)
  const [currentPdfData, setCurrentPdfData] = useState<MonitoriaFormData | null>(null)
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)

  const { data: projeto, isLoading: isLoadingProjeto } = api.projeto.getProjeto.useQuery(
    { id: projectId },
    { refetchOnMount: true, staleTime: 0 } // Always fetch fresh data when mounting
  )
  const { data: currentUser, isLoading: isLoadingUser } = api.me.getMe.useQuery()

  // Get the discipline ID from the project
  const disciplinaId = projeto?.disciplinas?.[0]?.id

  // Query template for the discipline
  const { data: currentTemplate, isLoading: isLoadingTemplate } = api.projetoTemplates.getTemplateByDisciplinaForProfessor.useQuery(
    { disciplinaId: disciplinaId ?? 0 },
    { enabled: !!disciplinaId }
  )

  const updateProjeto = api.projeto.updateProjeto.useMutation()
  const upsertTemplate = api.projetoTemplates.upsertTemplateByProfessor.useMutation({
    onSuccess: async (result) => {
      toast({
        title: result.isNew ? "Template criado" : "Template atualizado",
        description: result.isNew
          ? "Template padrão criado com sucesso para esta disciplina."
          : "Template padrão atualizado com sucesso.",
      })

      // Apply template values to the project form
      const templateValues = templateForm.getValues()
      const currentFormValues = form.getValues()
      form.reset({
        ...currentFormValues,
        titulo: templateValues.tituloDefault || currentFormValues.titulo,
        descricao: templateValues.descricaoDefault || currentFormValues.descricao,
        cargaHorariaSemana: templateValues.cargaHorariaSemanaDefault || currentFormValues.cargaHorariaSemana,
        numeroSemanas: templateValues.numeroSemanasDefault || currentFormValues.numeroSemanas,
        publicoAlvo: templateValues.publicoAlvoDefault || currentFormValues.publicoAlvo,
      })

      if (disciplinaId) {
        await apiUtils.projetoTemplates.getTemplateByDisciplinaForProfessor.invalidate({
          disciplinaId,
        })
      }
      setIsEditingTemplate(false)
    },
    onError: (error) => {
      const errorResponse = formatErrorResponse(error)
      toast({
        title: errorResponse.title,
        description: errorResponse.message,
        variant: "destructive",
      })
    },
  })
  const apiUtils = api.useUtils()

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      departamentoId: 0,
      ano: new Date().getFullYear(),
      semestre: SEMESTRE_1,
      tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
      professoresParticipantes: "",
      bolsasSolicitadas: 0,
      voluntariosSolicitados: 0,
      cargaHorariaSemana: 12,
      numeroSemanas: 17,
      publicoAlvo: "Estudantes de graduação",
      estimativaPessoasBenificiadas: 0,
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

  // Initialize form from project data
  // Uses projeto.id as a key to reset when viewing a different project
  useEffect(() => {
    if (!projeto) return

    // Allow editing for DRAFT and PENDING_PROFESSOR_SIGNATURE statuses
    if (projeto.status !== PROJETO_STATUS_DRAFT && projeto.status !== PROJETO_STATUS_PENDING_SIGNATURE) {
      router.back()
      return
    }

    // Transform professoresParticipantes from array to string if needed
    let professoresParticipantesStr: string | undefined = undefined
    if (Array.isArray(projeto.professoresParticipantes) && projeto.professoresParticipantes.length > 0) {
      professoresParticipantesStr = projeto.professoresParticipantes.map((p: any) => p.nomeCompleto).join(", ")
    } else if (typeof projeto.professoresParticipantes === "string") {
      professoresParticipantesStr = projeto.professoresParticipantes
    }

    const formData: ProjetoFormData = {
      titulo: projeto.titulo,
      descricao: projeto.descricao,
      departamentoId: projeto.departamentoId ?? 0,
      ano: projeto.ano,
      semestre: projeto.semestre,
      tipoProposicao: projeto.tipoProposicao,
      professoresParticipantes: professoresParticipantesStr,
      bolsasSolicitadas: projeto.bolsasSolicitadas,
      voluntariosSolicitados: projeto.voluntariosSolicitados,
      cargaHorariaSemana: projeto.cargaHorariaSemana,
      numeroSemanas: projeto.numeroSemanas,
      publicoAlvo: projeto.publicoAlvo,
      estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas ?? undefined,
      disciplinas: projeto.disciplinas?.map((d) => d.id) || [],
    }
    form.reset(formData)

    // Set atividades - transform from array of objects to array of strings
    const atividadesFromDB = projeto.atividades || []
    let atividadesStrings: string[] = []

    if (atividadesFromDB.length > 0) {
      if (typeof atividadesFromDB[0] === "object" && atividadesFromDB[0] !== null && "descricao" in atividadesFromDB[0]) {
        atividadesStrings = atividadesFromDB.map((a: any) => a.descricao)
      } else {
        atividadesStrings = atividadesFromDB as unknown as string[]
      }
    }

    setAtividades(atividadesStrings.length > 0 ? atividadesStrings : DEFAULT_ATIVIDADES)

    // Set público alvo
    if (projeto.publicoAlvo === "Estudantes de graduação") {
      setPublicoAlvoTipo("estudantes_graduacao")
    } else {
      setPublicoAlvoTipo("outro")
      setPublicoAlvoCustom(projeto.publicoAlvo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto?.id, projeto?.updatedAt]) // Re-run when project id or updatedAt changes

  // Initialize template form when editing template
  // NOTE: atividades is NOT in dependencies to prevent infinite loop when adding activities
  useEffect(() => {
    if (isEditingTemplate && disciplinaId) {
      if (currentTemplate) {
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
        } else {
          setAtividades(DEFAULT_ATIVIDADES)
        }

        // Set público alvo type for template
        if (currentTemplate.publicoAlvoDefault === "Estudantes de graduação") {
          setPublicoAlvoTipo("estudantes_graduacao")
        } else if (currentTemplate.publicoAlvoDefault) {
          setPublicoAlvoTipo("outro")
          setPublicoAlvoCustom(currentTemplate.publicoAlvoDefault)
        }
      } else {
        // No template exists - use current project values as defaults
        const currentFormValues = form.getValues()
        templateForm.reset({
          tituloDefault: currentFormValues.titulo || "",
          descricaoDefault: currentFormValues.descricao || "",
          cargaHorariaSemanaDefault: currentFormValues.cargaHorariaSemana || 12,
          numeroSemanasDefault: currentFormValues.numeroSemanas || 16,
          publicoAlvoDefault: currentFormValues.publicoAlvo || "Estudantes de graduação",
          atividadesDefault: [],
        })
        // Keep current atividades when no template exists
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingTemplate, currentTemplate, disciplinaId])

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)

    if (isEditingTemplate) {
      templateForm.setValue("atividadesDefault", newAtividades)
    }
  }

  const handleAddAtividade = () => {
    setAtividades([...atividades, ""])
  }

  const handleRemoveAtividade = (index: number) => {
    if (atividades.length > 1) {
      const newAtividades = atividades.filter((_, i) => i !== index)
      setAtividades(newAtividades)

      if (isEditingTemplate) {
        templateForm.setValue("atividadesDefault", newAtividades)
      }
    }
  }

  const generatePdfData = useCallback(
    (formValues: ProjetoFormData | TemplateFormData, isTemplate = false): MonitoriaFormData | null => {
      if (!projeto || !currentUser?.professor) return null

      const professor = currentUser.professor
      const projetoDisciplinas = projeto.disciplinas || []

      if (isTemplate) {
        const templateValues = formValues as TemplateFormData
        return {
          titulo: templateValues.tituloDefault || `Template - ${projetoDisciplinas[0]?.nome || "Disciplina"}`,
          descricao: templateValues.descricaoDefault || "",
          ano: new Date().getFullYear(),
          semestre: SEMESTRE_1,
          tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
          bolsasSolicitadas: 1,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: templateValues.cargaHorariaSemanaDefault || 12,
          numeroSemanas: templateValues.numeroSemanasDefault || 17,
          publicoAlvo: templateValues.publicoAlvoDefault || "Estudantes de graduação",
          estimativaPessoasBenificiadas: 50,
          disciplinas: projetoDisciplinas.map((d) => ({
            id: d.id,
            codigo: d.codigo,
            nome: d.nome,
          })),
          atividades: atividades.filter((a) => a.trim() !== ""),
          professorResponsavel: {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial,
            genero: professor.genero,
            cpf: professor.cpf,
            matriculaSiape: professor.matriculaSiape,
            regime: professor.regime,
            telefone: professor.telefone,
            telefoneInstitucional: professor.telefoneInstitucional,
            emailInstitucional: professor.emailInstitucional,
          },
          user: {
            username: currentUser.username,
            email: currentUser.email,
            role: "professor",
          },
        }
      }

      const projectValues = formValues as ProjetoFormData
      return {
        titulo: projectValues.titulo,
        descricao: projectValues.descricao,
        ano: projectValues.ano,
        semestre: projectValues.semestre,
        tipoProposicao: projectValues.tipoProposicao,
        professoresParticipantes: projectValues.professoresParticipantes,
        numeroMonitroresSolicitados: projectValues.bolsasSolicitadas + projectValues.voluntariosSolicitados,
        bolsasSolicitadas: projectValues.bolsasSolicitadas,
        voluntariosSolicitados: projectValues.voluntariosSolicitados,
        cargaHorariaSemana: projectValues.cargaHorariaSemana,
        numeroSemanas: projectValues.numeroSemanas,
        publicoAlvo: projectValues.publicoAlvo,
        estimativaPessoasBenificiadas: projectValues.estimativaPessoasBenificiadas || 0,
        disciplinas: projetoDisciplinas.map((d) => ({
          id: d.id,
          codigo: d.codigo,
          nome: d.nome,
        })),
        atividades: atividades.filter((a) => a.trim() !== ""),
        professorResponsavel: {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          nomeSocial: professor.nomeSocial,
          genero: professor.genero,
          cpf: professor.cpf,
          matriculaSiape: professor.matriculaSiape,
          regime: professor.regime,
          telefone: professor.telefone,
          telefoneInstitucional: professor.telefoneInstitucional,
          emailInstitucional: professor.emailInstitucional,
        },
        user: {
          username: currentUser.username,
          email: currentUser.email,
          role: "professor",
        },
      }
    },
    [projeto, currentUser, atividades]
  )

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

      await new Promise((resolve) => setTimeout(resolve, 500))

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

  const onSubmitTemplate = async (data: TemplateFormData) => {
    if (!disciplinaId) return

    const templateData = {
      disciplinaId,
      ...data,
      atividadesDefault: atividades.filter((a) => a.trim() !== ""),
    }

    await upsertTemplate.mutateAsync(templateData)
  }

  const onSubmit = async (data: ProjetoFormData) => {
    try {
      const atividadesFiltradas = atividades.filter((atividade) => atividade.trim() !== "")

      const projetoData = {
        id: projectId,
        ...data,
        atividades: atividadesFiltradas,
      }

      await updateProjeto.mutateAsync(projetoData)

      toast({
        title: "Projeto atualizado",
        description: "Seu projeto foi atualizado com sucesso.",
      })

      await apiUtils.projeto.getProjetos.invalidate()
      router.push("/home/professor/dashboard")
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message || "Ocorreu um erro ao atualizar o projeto.",
        variant: "destructive",
      })
    }
  }

  const hasTemplate = !!currentTemplate
  const isLoading = isLoadingProjeto || isLoadingTemplate

  if (isLoading) {
    return (
      <PagesLayout title="Carregando Projeto...">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        </div>
      </PagesLayout>
    )
  }

  if (!projeto) {
    return (
      <PagesLayout title="Projeto não encontrado">
        <p>O projeto que você está tentando editar não foi encontrado.</p>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title={isEditingTemplate ? "Criar Template Padrão" : "Editar Projeto de Monitoria"}
      subtitle={`${isEditingTemplate ? "Template para" : "Editando"}: ${projeto.disciplinas?.[0]?.codigo || ""} - ${projeto.titulo}`}
    >
      <div className="space-y-6">
        <Button variant="outline" onClick={() => (isEditingTemplate ? setIsEditingTemplate(false) : router.back())}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditingTemplate ? "Voltar ao Projeto" : "Voltar"}
        </Button>

        {/* Info sobre disciplinas do projeto */}
        {projeto.disciplinas && projeto.disciplinas.length > 0 && !isEditingTemplate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Disciplina(s):</span>{" "}
              {projeto.disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join(", ")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário (Esquerda) */}
          <div className="space-y-6">
            {!hasTemplate && !isEditingTemplate ? (
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
                onSubmit={onSubmit}
                isSubmitting={updateProjeto.isPending}
                atividades={atividades}
                onAtividadeChange={handleAtividadeChange}
                onAddAtividade={handleAddAtividade}
                onRemoveAtividade={handleRemoveAtividade}
                publicoAlvoTipo={publicoAlvoTipo}
                setPublicoAlvoTipo={setPublicoAlvoTipo}
                publicoAlvoCustom={publicoAlvoCustom}
                setPublicoAlvoCustom={setPublicoAlvoCustom}
                submitButtonText="Salvar Alterações"
                submittingButtonText="Salvando..."
              />
            )}
          </div>

          {/* Preview (Direita) */}
          <div className="space-y-4">
            {!hasTemplate && !isEditingTemplate ? (
              <TemplateRequiredAlert onCreateTemplate={() => setIsEditingTemplate(true)} variant="sidebar" />
            ) : (
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {isEditingTemplate ? "Preview do Template" : "Preview do Documento"}
                  </h3>
                  <div className="flex gap-2">
                    {!isEditingTemplate && hasTemplate && (
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
      </div>
    </PagesLayout>
  )
}
