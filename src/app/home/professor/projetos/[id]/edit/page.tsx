"use client"

import { MonitoriaFormTemplate } from "@/components/features/projects/MonitoriaFormTemplate"
import { ProjectForm } from "@/components/features/projects/ProjectForm"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
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
import { ArrowLeft, Eye, FileText, Loader2, RefreshCw } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type ProjetoFormData = z.infer<typeof projectFormSchema>

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

  const { data: projeto, isLoading: isLoadingProjeto } = api.projeto.getProjeto.useQuery({ id: projectId })
  const { data: currentUser, isLoading: isLoadingUser } = api.me.getMe.useQuery()
  const updateProjeto = api.projeto.updateProjeto.useMutation()
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

  useEffect(() => {
    // Allow editing for DRAFT and PENDING_PROFESSOR_SIGNATURE statuses
    if (projeto && projeto.status !== PROJETO_STATUS_DRAFT && projeto.status !== PROJETO_STATUS_PENDING_SIGNATURE) {
      router.back()
    }
    if (projeto) {
      // Transform professoresParticipantes from array to string if needed
      let professoresParticipantesStr: string | undefined = undefined
      if (Array.isArray(projeto.professoresParticipantes) && projeto.professoresParticipantes.length > 0) {
        // If it's an array of objects, extract nomeCompleto
        professoresParticipantesStr = projeto.professoresParticipantes.map((p: any) => p.nomeCompleto).join(", ")
      } else if (typeof projeto.professoresParticipantes === "string") {
        professoresParticipantesStr = projeto.professoresParticipantes
      }

      const formData: ProjetoFormData = {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        departamentoId: projeto.departamentoId,
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
        // Check if it's array of objects or array of strings
        if (
          typeof atividadesFromDB[0] === "object" &&
          atividadesFromDB[0] !== null &&
          "descricao" in atividadesFromDB[0]
        ) {
          atividadesStrings = atividadesFromDB.map((a: any) => a.descricao)
        } else {
          // It's already an array of strings
          atividadesStrings = atividadesFromDB as unknown as string[]
        }
      }

      setAtividades(atividadesStrings.length > 0 ? atividadesStrings : [""])

      // Set público alvo
      if (projeto.publicoAlvo === "Estudantes de graduação") {
        setPublicoAlvoTipo("estudantes_graduacao")
      } else {
        setPublicoAlvoTipo("outro")
        setPublicoAlvoCustom(projeto.publicoAlvo)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto])

  const handleAtividadeChange = (index: number, value: string) => {
    const newAtividades = [...atividades]
    newAtividades[index] = value
    setAtividades(newAtividades)
  }

  const handleAddAtividade = () => {
    setAtividades([...atividades, ""])
  }

  const handleRemoveAtividade = (index: number) => {
    if (atividades.length > 1) {
      setAtividades(atividades.filter((_, i) => i !== index))
    }
  }

  const generatePdfData = useCallback(
    (formValues: ProjetoFormData): MonitoriaFormData | null => {
      if (!projeto || !currentUser?.professor) return null

      const professor = currentUser.professor
      // Use disciplinas from the projeto itself (already loaded)
      const projetoDisciplinas = projeto.disciplinas || []

      return {
        titulo: formValues.titulo,
        descricao: formValues.descricao,
        ano: formValues.ano,
        semestre: formValues.semestre,
        tipoProposicao: formValues.tipoProposicao,
        professoresParticipantes: formValues.professoresParticipantes,
        numeroMonitroresSolicitados: formValues.bolsasSolicitadas + formValues.voluntariosSolicitados,
        bolsasSolicitadas: formValues.bolsasSolicitadas,
        voluntariosSolicitados: formValues.voluntariosSolicitados,
        cargaHorariaSemana: formValues.cargaHorariaSemana,
        numeroSemanas: formValues.numeroSemanas,
        publicoAlvo: formValues.publicoAlvo,
        estimativaPessoasBenificiadas: formValues.estimativaPessoasBenificiadas || 0,
        disciplinas: projetoDisciplinas.map((d) => ({
          id: d.id,
          codigo: d.codigo,
          nome: d.nome,
        })),
        atividades: atividades.filter((a) => a.trim() !== ""),
        professorResponsavel: {
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

  if (isLoadingProjeto) {
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
    <PagesLayout title="Editar Projeto de Monitoria" subtitle={`Editando: ${projeto.titulo}`}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Info sobre disciplinas do projeto */}
        {projeto.disciplinas && projeto.disciplinas.length > 0 && (
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
          </div>

          {/* Preview (Direita) */}
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview do Documento</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdatePreview}
                    disabled={isGeneratingPreview || !showPreview}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
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
                </div>
              </div>

              {!showPreview ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Gere o Preview</h4>
                  <p className="text-gray-600 mb-4">Visualize como ficará o documento antes de salvar</p>

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
                        Gerar Preview
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {isLoadingUser ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                      <p>Carregando dados do professor...</p>
                    </div>
                  ) : currentPdfData ? (
                    <PDFPreviewComponent key={pdfKey} data={currentPdfData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Erro ao carregar preview</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PagesLayout>
  )
}
