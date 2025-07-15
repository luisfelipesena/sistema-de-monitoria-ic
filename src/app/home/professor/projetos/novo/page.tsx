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
import { Eye, FileText, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Componente memoizado para o PDFViewer - sem atualizações automáticas
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

export default function NovoProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()
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
  const apiUtils = api.useUtils()

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      titulo: "Monitoria de Programação I",
      descricao:
        "Projeto de monitoria para auxiliar estudantes da disciplina Programação I no desenvolvimento de habilidades de programação básica, resolução de problemas algorítmicos e compreensão de conceitos fundamentais da programação.",
      departamentoId: 0,
      ano: new Date().getFullYear(),
      semestre: "SEMESTRE_1",
      tipoProposicao: "INDIVIDUAL",
      bolsasSolicitadas: 1,
      voluntariosSolicitados: 2,
      cargaHorariaSemana: 12,
      numeroSemanas: 16,
      publicoAlvo: "Estudantes de graduação",
      estimativaPessoasBenificiadas: 50,
      disciplinas: [],
    },
  })

  // Atualiza o publicoAlvo baseado no tipo selecionado
  useEffect(() => {
    if (publicoAlvoTipo === "estudantes_graduacao") {
      form.setValue("publicoAlvo", "Estudantes de graduação")
    } else if (publicoAlvoTipo === "outro" && publicoAlvoCustom.trim()) {
      form.setValue("publicoAlvo", publicoAlvoCustom)
    }
  }, [publicoAlvoTipo, publicoAlvoCustom, form])

  const departamentoSelecionado = form.watch("departamentoId")

  const disciplinasFiltradas = disciplinas?.filter(
    (disciplina) => disciplina.departamentoId === departamentoSelecionado
  )

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

  const validateRequiredFields = useCallback((values: ProjetoFormData) => {
    const errors = []
    if (!values.titulo?.trim()) errors.push("Título")
    if (!values.descricao?.trim()) errors.push("Descrição")
    if (!values.departamentoId || values.departamentoId === 0) errors.push("Departamento")
    if (!values.disciplinas || values.disciplinas.length === 0) errors.push("Disciplina")
    if (!values.publicoAlvo?.trim()) errors.push("Público Alvo")
    return { isValid: errors.length === 0, missingFields: errors }
  }, [])

  const getCurrentValidation = useCallback(() => {
    const currentValues = form.getValues()
    return validateRequiredFields(currentValues)
  }, [form, validateRequiredFields])

  const firstDisciplinaId = currentPdfData?.disciplinas?.[0]?.id
  const { data: disciplinaWithProfessor, isLoading: isLoadingProfessor } =
    api.discipline.getDisciplineWithProfessor.useQuery(
      { id: firstDisciplinaId! },
      { enabled: !!firstDisciplinaId && firstDisciplinaId !== 0 && showPreview }
    )

  const generatePdfData = useCallback(
    (formValues: ProjetoFormData): MonitoriaFormData | null => {
      if (!departamentos || !disciplinas) return null

      const departamento = departamentos.find((d) => d.id === formValues.departamentoId)
      const selectedDisciplinas = disciplinas.filter((d) => formValues.disciplinas.includes(d.id))

      if (!departamento || selectedDisciplinas.length === 0) return null

      const professor = disciplinaWithProfessor?.professor

      return {
        titulo: formValues.titulo,
        descricao: formValues.descricao,
        departamento: {
          id: departamento.id,
          nome: departamento.nome,
        },
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
        ano: formValues.ano,
        semestre: formValues.semestre,
        tipoProposicao: formValues.tipoProposicao,
        bolsasSolicitadas: formValues.bolsasSolicitadas || 0,
        voluntariosSolicitados: formValues.voluntariosSolicitados || 0,
        cargaHorariaSemana: formValues.cargaHorariaSemana,
        numeroSemanas: formValues.numeroSemanas,
        publicoAlvo: formValues.publicoAlvo,
        estimativaPessoasBenificiadas: formValues.estimativaPessoasBenificiadas || 0,
        disciplinas: selectedDisciplinas.map((d) => ({
          id: d.id,
          codigo: d.codigo,
          nome: d.nome,
        })),
        atividades: atividades.filter((atividade) => atividade.trim() !== ""),
        user: {
          email: professor?.emailInstitucional || "professor@ufba.br",
          nomeCompleto: professor?.nomeCompleto || "Professor",
          role: "professor",
        },
      }
    },
    [departamentos, disciplinas, disciplinaWithProfessor?.professor, atividades]
  )

  const handleAddAtividade = () => {
    setAtividades([...atividades, ""])
  }

  const handleRemoveAtividade = (index: number) => {
    const newAtividades = atividades.filter((_, i) => i !== index)
    setAtividades(newAtividades)
  }

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)
  }

  const onSubmit = async (data: ProjetoFormData) => {
    try {
      const atividadesFiltradas = atividades.filter((atividade) => atividade.trim() !== "")

      const projetoData = {
        ...data,
        disciplinaIds: data.disciplinas,
        atividades: atividadesFiltradas,
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
    const validation = getCurrentValidation()
    if (!validation.isValid) {
      toast({
        title: "Campos obrigatórios pendentes",
        description: `Preencha os campos: ${validation.missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPreview(true)

    try {
      const formValues = form.getValues()
      const pdfData = generatePdfData(formValues)

      if (!pdfData) {
        toast({
          title: "Erro ao gerar preview",
          description: "Não foi possível gerar o preview com os dados fornecidos",
          variant: "destructive",
        })
        setIsGeneratingPreview(false)
        return
      }

      // Simulate loading time for better UX
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

  const handleUpdatePreview = async () => {
    const validation = getCurrentValidation()
    if (!validation.isValid) {
      toast({
        title: "Campos obrigatórios pendentes",
        description: `Preencha os campos: ${validation.missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPreview(true)

    try {
      const formValues = form.getValues()
      const pdfData = generatePdfData(formValues)

      if (!pdfData) {
        toast({
          title: "Erro ao atualizar preview",
          description: "Não foi possível atualizar o preview com os dados fornecidos",
          variant: "destructive",
        })
        setIsGeneratingPreview(false)
        return
      }

      // Simulate loading time for better UX
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

  if (!departamentos?.length) {
    return (
      <PagesLayout title="Novo Projeto de Monitoria">
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Dados necessários não encontrados</h3>
          <p className="text-muted-foreground mb-4">
            Para criar projetos de monitoria, é necessário ter departamentos cadastrados no sistema.
          </p>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Novo projeto de monitoria"
      subtitle="Formulário para criação de projeto de monitoria - rascunho"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departamentoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(parseInt(value))
                              form.setValue("disciplinas", []) // Reset discipline when department changes
                            }}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o departamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departamentos?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="disciplinas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disciplina</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              // Mantém como array mas com apenas um item
                              field.onChange([parseInt(value)])
                            }}
                            disabled={!departamentoSelecionado}
                            value={field.value?.[0]?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a disciplina" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplinasFiltradas?.map((disciplina) => (
                                <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                                  {disciplina.codigo} ({disciplina.turma}) - {disciplina.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                                <RadioGroupItem value="estudantes_graduacao" id="estudantes_graduacao" />
                                <label
                                  htmlFor="estudantes_graduacao"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Estudantes de graduação
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="outro" id="outro" />
                                <label
                                  htmlFor="outro"
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
                <Button type="button" variant="outline" onClick={() => router.push("/home/professor/dashboard")}>
                  Cancelar
                </Button>
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
