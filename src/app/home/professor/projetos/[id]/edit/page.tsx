"use client"

import { ProjectFormFields } from "@/components/features/projects/ProjectFormFields"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { projectFormSchema } from "@/types"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type ProjetoFormData = z.infer<typeof projectFormSchema>

export default function EditProjetoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const projectId = parseInt(params.id as string)

  const [atividades, setAtividades] = useState<string[]>([])
  const [publicoAlvoTipo, setPublicoAlvoTipo] = useState<"estudantes_graduacao" | "outro">("estudantes_graduacao")
  const [publicoAlvoCustom, setPublicoAlvoCustom] = useState("")

  const { data: departamentos } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const { data: disciplinas } = api.discipline.getDisciplines.useQuery()
  const { data: projeto, isLoading: isLoadingProjeto } = api.projeto.getProjeto.useQuery({ id: projectId })
  const updateProjeto = api.projeto.updateProjeto.useMutation()
  const apiUtils = api.useUtils()

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projectFormSchema),
  })

  useEffect(() => {
    if (projeto) {
      // Transform professoresParticipantes from array to string if needed
      let professoresParticipantesStr: string | undefined = undefined
      if (Array.isArray(projeto.professoresParticipantes) && projeto.professoresParticipantes.length > 0) {
        // If it's an array of objects, extract nomeCompleto
        professoresParticipantesStr = projeto.professoresParticipantes.map((p: any) => p.nomeCompleto).join(', ')
      } else if (typeof projeto.professoresParticipantes === 'string') {
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
        if (typeof atividadesFromDB[0] === 'object' && atividadesFromDB[0] !== null && 'descricao' in atividadesFromDB[0]) {
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
  }, [projeto, form])

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProjectFormFields
              form={form}
              departamentos={departamentos}
              disciplinas={disciplinas}
              atividades={atividades}
              onAtividadeChange={handleAtividadeChange}
              onAddAtividade={handleAddAtividade}
              onRemoveAtividade={handleRemoveAtividade}
              publicoAlvoTipo={publicoAlvoTipo}
              setPublicoAlvoTipo={setPublicoAlvoTipo}
              publicoAlvoCustom={publicoAlvoCustom}
              setPublicoAlvoCustom={setPublicoAlvoCustom}
              isEditMode={true}
            />

            <div className="flex justify-end space-x-4">
              <Button type="submit" disabled={updateProjeto.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateProjeto.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PagesLayout>
  )
}
