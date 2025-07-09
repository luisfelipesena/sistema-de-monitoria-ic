"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MonitoriaFormData, projectFormSchema } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { PDFViewer } from "@react-pdf/renderer"
import { Eye, FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"

// Componente memoizado para o PDFViewer
const PDFPreviewComponent = React.memo(({ data }: { data: MonitoriaFormData }) => {
  return (
    <div className="border rounded-lg bg-white">
      <div className="bg-blue-50 border-b px-4 py-2">
        <p className="text-sm text-blue-800 font-medium">
          ✅ Preview gerado com sucesso - Dados atualizados automaticamente
        </p>
      </div>
      <div style={{ width: '100%', height: '800px' }}>
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <MonitoriaFormTemplate data={data} />
        </PDFViewer>
      </div>
    </div>
  )
})
import { useForm } from "react-hook-form"
import { z } from "zod"

type ProjetoFormData = z.infer<typeof projectFormSchema>

export default function NovoProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [pdfKey, setPdfKey] = useState(0)
  const [atividades, setAtividades] = useState<string[]>([
    "Auxiliar na elaboração de exercícios práticos de programação",
    "Apoiar estudantes em horários de plantão para esclarecimento de dúvidas",
    "Colaborar na revisão de códigos e debugging",
    "Ajudar na preparação de material didático complementar",
  ])
  const [debouncedFormValues, setDebouncedFormValues] = useState<ProjetoFormData | null>(null)

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
      publicoAlvo:
        "Estudantes matriculados na disciplina Programação I que apresentem dificuldades no aprendizado de conceitos básicos de programação",
      estimativaPessoasBenificiadas: 50,
      disciplinas: [0],
    },
  })

  const departamentoSelecionado = form.watch("departamentoId")

  const disciplinasFiltradas = disciplinas?.filter(
    (disciplina) => disciplina.departamentoId === departamentoSelecionado
  )

  const formValues = form.watch()

  // Debounce form values to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormValues(formValues)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [formValues])

  const validateRequiredFields = useCallback((values: ProjetoFormData) => {
    const errors = []
    if (!values.titulo?.trim()) errors.push("Título")
    if (!values.descricao?.trim()) errors.push("Descrição")
    if (!values.departamentoId || values.departamentoId === 0) errors.push("Departamento")
    if (!values.disciplinas || values.disciplinas.length === 0 || values.disciplinas.includes(0)) errors.push("Disciplina")
    if (!values.publicoAlvo?.trim()) errors.push("Público Alvo")
    return { isValid: errors.length === 0, missingFields: errors }
  }, [])

  const { isValid: canGeneratePreview, missingFields } = debouncedFormValues
    ? validateRequiredFields(debouncedFormValues)
    : { isValid: false, missingFields: ["Carregando..."] }

  const firstDisciplinaId = debouncedFormValues?.disciplinas?.[0]
  const { data: disciplinaWithProfessor, isLoading: isLoadingProfessor } =
    api.discipline.getDisciplineWithProfessor.useQuery(
      { id: firstDisciplinaId! },
      { enabled: !!firstDisciplinaId && firstDisciplinaId !== 0 && showPreview }
    )

  const pdfData: MonitoriaFormData | null = React.useMemo(() => {
    if (!showPreview || !canGeneratePreview || !debouncedFormValues) return null

    const departamento = departamentos?.find((d) => d.id === debouncedFormValues.departamentoId)
    const selectedDisciplinas = disciplinas?.filter((d) => debouncedFormValues.disciplinas.includes(d.id)) || []

    if (!departamento || selectedDisciplinas.length === 0) return null

    const professor = disciplinaWithProfessor?.professor

    // Cria um objeto estável para evitar re-renderização constante
    const data: MonitoriaFormData = {
      titulo: debouncedFormValues.titulo,
      descricao: debouncedFormValues.descricao,
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
      ano: debouncedFormValues.ano,
      semestre: debouncedFormValues.semestre,
      tipoProposicao: debouncedFormValues.tipoProposicao,
      bolsasSolicitadas: debouncedFormValues.bolsasSolicitadas || 0,
      voluntariosSolicitados: debouncedFormValues.voluntariosSolicitados || 0,
      cargaHorariaSemana: debouncedFormValues.cargaHorariaSemana,
      numeroSemanas: debouncedFormValues.numeroSemanas,
      publicoAlvo: debouncedFormValues.publicoAlvo,
      estimativaPessoasBenificiadas: debouncedFormValues.estimativaPessoasBenificiadas || 0,
      disciplinas: selectedDisciplinas.map((d) => ({
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
      })),
      user: {
        email: professor?.emailInstitucional || "professor@ufba.br",
        nomeCompleto: professor?.nomeCompleto || "Professor",
        role: "professor",
      },
    }

    return data
  }, [
    showPreview, 
    canGeneratePreview, 
    debouncedFormValues?.titulo,
    debouncedFormValues?.descricao,
    debouncedFormValues?.departamentoId,
    debouncedFormValues?.disciplinas?.join(','),
    debouncedFormValues?.ano,
    debouncedFormValues?.semestre,
    debouncedFormValues?.tipoProposicao,
    debouncedFormValues?.bolsasSolicitadas,
    debouncedFormValues?.voluntariosSolicitados,
    debouncedFormValues?.cargaHorariaSemana,
    debouncedFormValues?.numeroSemanas,
    debouncedFormValues?.publicoAlvo,
    debouncedFormValues?.estimativaPessoasBenificiadas,
    disciplinaWithProfessor?.professor?.id,
    disciplinaWithProfessor?.professor?.nomeCompleto,
    disciplinaWithProfessor?.professor?.emailInstitucional,
    departamentos?.length,
    disciplinas?.length
  ])

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
    if (!canGeneratePreview) return

    setIsGeneratingPreview(true)
    setTimeout(() => {
      setShowPreview(true)
      setPdfKey(prev => prev + 1) // Força re-renderização do PDF
      setIsGeneratingPreview(false)
    }, 500)
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
                              form.setValue("disciplinas", []) // Clear disciplines when department changes
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
                          <FormLabel>Disciplinas</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const newValue = field.value?.includes(parseInt(value))
                                ? field.value.filter((id: number) => id !== parseInt(value))
                                : [...(field.value || []), parseInt(value)]
                              field.onChange(newValue)
                            }}
                            disabled={!departamentoSelecionado}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a(s) disciplina(s)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplinasFiltradas?.map((disciplina) => (
                                <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={field.value?.includes(disciplina.id)}
                                      onCheckedChange={() => {}}
                                    />
                                    {disciplina.codigo} - {disciplina.nome}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value?.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {field.value.length} disciplina(s) selecionada(s)
                            </div>
                          )}
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
                          <Textarea placeholder="Descreva o público alvo do projeto" rows={3} {...field} />
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
              {showPreview && (
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  Ocultar Preview
                </Button>
              )}
            </div>

            {!showPreview ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Gere o Preview do Documento</h4>
                <p className="text-gray-600 mb-4">
                  Visualize como ficará o formulário oficial de monitoria antes de salvar
                </p>

                {!canGeneratePreview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-amber-800 mb-2">Campos obrigatórios pendentes:</h5>
                    <ul className="text-sm text-amber-700 list-disc list-inside">
                      {missingFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={handleGeneratePreview}
                  disabled={!canGeneratePreview || isGeneratingPreview}
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
                {isLoadingProfessor && firstDisciplinaId && firstDisciplinaId !== 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                    <p>Carregando dados do professor...</p>
                  </div>
                ) : pdfData ? (
                  <PDFPreviewComponent key={pdfKey} data={pdfData} />
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
