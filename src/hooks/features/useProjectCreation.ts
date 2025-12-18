import { useToast } from '@/hooks/use-toast'
import type { MonitoriaFormData } from '@/types'
import {
  formatErrorResponse,
  projectFormSchema,
  PROJETO_STATUS_DRAFT,
  SEMESTRE_1,
  TIPO_PROPOSICAO_INDIVIDUAL,
} from '@/types'
import { api } from '@/utils/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { parseAsBoolean, parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

const DEFAULT_ATIVIDADES = [
  'Auxiliar na elaboração de exercícios práticos de programação',
  'Apoiar estudantes em horários de plantão para esclarecimento de dúvidas',
  'Colaborar na revisão de códigos e debugging',
  'Ajudar na preparação de material didático complementar',
]

export function useProjectCreation() {
  const { toast } = useToast()
  const router = useRouter()
  const apiUtils = api.useUtils()

  // URL State management with nuqs
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useQueryState('disciplina', parseAsInteger)
  const [isEditingTemplate, setIsEditingTemplate] = useQueryState('template', parseAsBoolean.withDefault(false))

  // Local state
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [pdfKey, setPdfKey] = useState(0)
  const [publicoAlvoTipo, setPublicoAlvoTipo] = useState<'estudantes_graduacao' | 'outro'>('estudantes_graduacao')
  const [publicoAlvoCustom, setPublicoAlvoCustom] = useState('')
  const [currentPdfData, setCurrentPdfData] = useState<MonitoriaFormData | null>(null)
  const [atividades, setAtividades] = useState<string[]>(DEFAULT_ATIVIDADES)

  // Queries
  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const { data: disciplinas } = api.discipline.getDepartmentDisciplines.useQuery()
  const { data: currentTemplate } = api.projetoTemplates.getTemplateByDisciplinaForProfessor.useQuery(
    { disciplinaId: selectedDisciplinaId ?? 0 },
    { enabled: !!selectedDisciplinaId }
  )
  const { data: currentUser, isLoading: isLoadingUser } = api.me.getMe.useQuery()

  // Mutations
  const createProjeto = api.projeto.createProjeto.useMutation({
    onSuccess: async () => {
      toast({
        title: 'Projeto criado',
        description: 'Projeto criado com sucesso como rascunho.',
      })
      await apiUtils.projeto.getProjetos.invalidate()
      router.push('/home/professor/dashboard')
    },
    onError: (error) => {
      const errorResponse = formatErrorResponse(error)
      toast({
        title: errorResponse.title,
        description: errorResponse.message,
        variant: 'destructive',
      })
    },
  })

  const upsertTemplate = api.projetoTemplates.upsertTemplateByProfessor.useMutation({
    onSuccess: async (result) => {
      toast({
        title: result.isNew ? 'Template criado' : 'Template atualizado',
        description: result.isNew
          ? 'Template padrão criado com sucesso para esta disciplina.'
          : 'Template padrão atualizado com sucesso.',
      })
      if (selectedDisciplinaId) {
        await apiUtils.projetoTemplates.getTemplateByDisciplinaForProfessor.invalidate({
          disciplinaId: selectedDisciplinaId,
        })
      }
      setIsEditingTemplate(false)
    },
    onError: (error) => {
      const errorResponse = formatErrorResponse(error)
      toast({
        title: errorResponse.title,
        description: errorResponse.message,
        variant: 'destructive',
      })
    },
  })

  // Forms
  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      departamentoId: 0,
      ano: new Date().getFullYear(),
      semestre: SEMESTRE_1,
      tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
      bolsasSolicitadas: 1,
      voluntariosSolicitados: 2,
      cargaHorariaSemana: 12,
      numeroSemanas: 17,
      publicoAlvo: 'Estudantes de graduação',
      estimativaPessoasBenificiadas: 50,
      disciplinas: [],
    },
  })

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      tituloDefault: '',
      descricaoDefault: '',
      cargaHorariaSemanaDefault: 12,
      numeroSemanasDefault: 16,
      publicoAlvoDefault: 'Estudantes de graduação',
      atividadesDefault: [],
    },
  })

  // Effects - Template form population
  useEffect(() => {
    if (currentTemplate && isEditingTemplate) {
      templateForm.reset({
        tituloDefault: currentTemplate.tituloDefault || '',
        descricaoDefault: currentTemplate.descricaoDefault || '',
        cargaHorariaSemanaDefault: currentTemplate.cargaHorariaSemanaDefault || 12,
        numeroSemanasDefault: currentTemplate.numeroSemanasDefault || 16,
        publicoAlvoDefault: currentTemplate.publicoAlvoDefault || 'Estudantes de graduação',
        atividadesDefault: currentTemplate.atividadesDefault || [],
      })

      if (currentTemplate.atividadesDefault?.length) {
        setAtividades(currentTemplate.atividadesDefault)
      }

      if (currentTemplate.publicoAlvoDefault === 'Estudantes de graduação') {
        setPublicoAlvoTipo('estudantes_graduacao')
      } else if (currentTemplate.publicoAlvoDefault) {
        setPublicoAlvoTipo('outro')
        setPublicoAlvoCustom(currentTemplate.publicoAlvoDefault)
      }
    }
  }, [currentTemplate, isEditingTemplate, templateForm])

  // Effects - Project form population from template
  useEffect(() => {
    if (selectedDisciplinaId && currentTemplate && !isEditingTemplate) {
      const disciplina = disciplinas?.find((d) => d.id === selectedDisciplinaId)
      if (!disciplina) return

      form.reset({
        titulo: currentTemplate.tituloDefault || `Monitoria de ${disciplina.nome}`,
        descricao: currentTemplate.descricaoDefault || '',
        departamentoId: disciplina.departamentoId,
        ano: new Date().getFullYear(),
        semestre: SEMESTRE_1,
        tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
        bolsasSolicitadas: 1,
        voluntariosSolicitados: 2,
        cargaHorariaSemana: currentTemplate.cargaHorariaSemanaDefault || 12,
        numeroSemanas: currentTemplate.numeroSemanasDefault || 16,
        publicoAlvo: currentTemplate.publicoAlvoDefault || 'Estudantes de graduação',
        estimativaPessoasBenificiadas: 50,
        disciplinas: [selectedDisciplinaId],
      })

      if (currentTemplate.atividadesDefault?.length) {
        setAtividades(currentTemplate.atividadesDefault)
      }

      if (currentTemplate.publicoAlvoDefault === 'Estudantes de graduação') {
        setPublicoAlvoTipo('estudantes_graduacao')
      } else if (currentTemplate.publicoAlvoDefault) {
        setPublicoAlvoTipo('outro')
        setPublicoAlvoCustom(currentTemplate.publicoAlvoDefault)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisciplinaId, currentTemplate, disciplinas, isEditingTemplate])

  // Effects - Publico Alvo sync
  useEffect(() => {
    if (isEditingTemplate) {
      if (publicoAlvoTipo === 'estudantes_graduacao') {
        templateForm.setValue('publicoAlvoDefault', 'Estudantes de graduação')
      } else if (publicoAlvoTipo === 'outro' && publicoAlvoCustom.trim()) {
        templateForm.setValue('publicoAlvoDefault', publicoAlvoCustom)
      }
    } else {
      if (publicoAlvoTipo === 'estudantes_graduacao') {
        form.setValue('publicoAlvo', 'Estudantes de graduação')
      } else if (publicoAlvoTipo === 'outro' && publicoAlvoCustom.trim()) {
        form.setValue('publicoAlvo', publicoAlvoCustom)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicoAlvoTipo, publicoAlvoCustom, isEditingTemplate])

  // PDF generation
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
          titulo: templateValues.tituloDefault || `Template - ${disciplina.nome}`,
          descricao: templateValues.descricaoDefault || '',
          departamento: { id: departamento.id, nome: departamento.nome },
          coordenadorResponsavel: 'Coordenador Responsável',
          professorResponsavel: professor
            ? {
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
              }
            : undefined,
          ano: new Date().getFullYear(),
          semestre: SEMESTRE_1,
          tipoProposicao: TIPO_PROPOSICAO_INDIVIDUAL,
          bolsasSolicitadas: 1,
          voluntariosSolicitados: 2,
          cargaHorariaSemana: templateValues.cargaHorariaSemanaDefault || 12,
          numeroSemanas: templateValues.numeroSemanasDefault || 17,
          cargaHorariaTotal: 204,
          publicoAlvo: templateValues.publicoAlvoDefault || 'Estudantes de graduação',
          estimativaPessoasBenificiadas: 50,
          disciplinas: [{ id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome }],
          atividades: atividades.filter((atividade) => atividade.trim() !== ''),
          user: {
            email: professor?.emailInstitucional || 'professor@ufba.br',
            nomeCompleto: professor?.nomeCompleto || 'Professor',
            role: 'professor',
          },
        }
      }
      const projectValues = formValues as ProjetoFormData
      return {
        titulo: projectValues.titulo,
        descricao: projectValues.descricao,
        departamento: { id: departamento.id, nome: departamento.nome },
        coordenadorResponsavel: 'Coordenador Responsável',
        professorResponsavel: professor
          ? {
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
        atividades: atividades.filter((atividade) => atividade.trim() !== ''),
        user: {
          email: professor?.emailInstitucional || 'professor@ufba.br',
          nomeCompleto: professor?.nomeCompleto || 'Professor',
          role: 'professor',
        },
      }
    },
    [departamentos, disciplinas, selectedDisciplinaId, currentUser?.professor, atividades]
  )

  // Handlers
  const handleDisciplinaSelect = async (disciplinaId: string) => {
    await setSelectedDisciplinaId(parseInt(disciplinaId))
    await setIsEditingTemplate(false)
    setShowPreview(false)
  }

  const handleBackToSelect = async () => {
    await setSelectedDisciplinaId(null)
    await setIsEditingTemplate(false)
    setShowPreview(false)
  }

  const handleAddAtividade = () => {
    setAtividades([...atividades, ''])
  }

  const handleRemoveAtividade = (index: number) => {
    const newAtividades = atividades.filter((_, i) => i !== index)
    setAtividades(newAtividades)

    if (isEditingTemplate) {
      templateForm.setValue('atividadesDefault', newAtividades)
    }
  }

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)

    if (isEditingTemplate) {
      templateForm.setValue('atividadesDefault', newAtividades)
    }
  }

  const onSubmitTemplate = async (data: TemplateFormData) => {
    if (!selectedDisciplinaId) return

    const templateData = {
      disciplinaId: selectedDisciplinaId,
      ...data,
      atividadesDefault: atividades.filter((a) => a.trim() !== ''),
    }

    await upsertTemplate.mutateAsync(templateData)
  }

  const onSubmitProject = async (data: ProjetoFormData) => {
    if (!currentTemplate) {
      toast({
        title: 'Template obrigatório',
        description: 'Você precisa criar um template padrão antes de criar projetos para esta disciplina.',
        variant: 'destructive',
      })
      return
    }

    const atividadesFiltradas = atividades.filter((atividade) => atividade.trim() !== '')

    const projetoData = {
      ...data,
      disciplinaIds: data.disciplinas,
      atividades: atividadesFiltradas,
      status: PROJETO_STATUS_DRAFT,
    }

    await createProjeto.mutateAsync(projetoData)
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
          title: 'Erro ao gerar preview',
          description: 'Não foi possível gerar o preview com os dados fornecidos',
          variant: 'destructive',
        })
        setIsGeneratingPreview(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 800))

      setCurrentPdfData(pdfData)
      setShowPreview(true)
      setPdfKey((prev) => prev + 1)
    } catch (error) {
      const errorResponse = formatErrorResponse(error)
      toast({
        title: errorResponse.title,
        description: errorResponse.message,
        variant: 'destructive',
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
          title: 'Erro ao atualizar preview',
          description: 'Não foi possível atualizar o preview com os dados fornecidos',
          variant: 'destructive',
        })
        setIsGeneratingPreview(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      setCurrentPdfData(pdfData)
      setPdfKey((prev) => prev + 1)
    } catch (error) {
      const errorResponse = formatErrorResponse(error)
      toast({
        title: errorResponse.title,
        description: errorResponse.message,
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  return {
    states: {
      selectedDisciplinaId,
      isEditingTemplate,
      showPreview,
      isGeneratingPreview,
      pdfKey,
      publicoAlvoTipo,
      publicoAlvoCustom,
      currentPdfData,
      atividades,
    },
    queries: {
      departamentos,
      disciplinas,
      currentTemplate,
      currentUser,
      isLoadingUser,
      isLoading: !departamentos || !disciplinas,
    },
    mutations: {
      createProjeto,
      upsertTemplate,
    },
    handlers: {
      handleDisciplinaSelect,
      handleBackToSelect,
      handleAddAtividade,
      handleRemoveAtividade,
      handleAtividadeChange,
      onSubmitTemplate,
      onSubmitProject,
      handleGeneratePreview,
      handleUpdatePreview,
      setIsEditingTemplate: (value: boolean) => setIsEditingTemplate(value),
      setPublicoAlvoTipo,
      setPublicoAlvoCustom,
    },
    forms: {
      form,
      templateForm,
    },
  }
}
