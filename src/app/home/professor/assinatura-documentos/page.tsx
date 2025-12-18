"use client"

import { InteractiveProjectPDF } from "@/components/features/projects/InteractiveProjectPDF"
import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { createSemesterFilterOptions, createYearFilterOptions } from "@/hooks/useColumnFilters"
import { useUrlColumnFilters } from "@/hooks/useUrlColumnFilters"
import {
  DashboardProjectItem,
  MonitoriaFormData,
  PROFESSOR,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_LABELS,
  PROJETO_STATUS_PENDING_SIGNATURE,
  SEMESTRE_1,
  SIGNING_MODE_PROFESSOR,
} from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, CheckCircle, FileSignature, List, Loader, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseAsInteger, useQueryState } from "nuqs"
import { Suspense, useEffect, useMemo, useRef } from "react"

// Filter options for status - only show statuses that need signing
const statusFilterOptions = [
  { value: PROJETO_STATUS_DRAFT, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_DRAFT] },
  { value: PROJETO_STATUS_PENDING_SIGNATURE, label: PROJETO_STATUS_LABELS[PROJETO_STATUS_PENDING_SIGNATURE] },
]

function DocumentSigningContent() {
  const { user } = useAuth()
  const router = useRouter()
  const referrerRef = useRef<string | null>(null)

  // Capture referrer on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      referrerRef.current = document.referrer
    }
  }, [])

  // Use nuqs for projetoId URL state
  const [selectedProjectId, setSelectedProjectId] = useQueryState("projetoId", parseAsInteger)

  const apiUtils = api.useUtils()
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  const { data: selectedProject, isLoading: loadingProject } = api.projeto.getProjeto.useQuery(
    { id: selectedProjectId || 0 },
    { enabled: !!selectedProjectId, refetchOnMount: true, staleTime: 0 }
  )

  // Column filters with URL state persistence
  const { columnFilters, setColumnFilters } = useUrlColumnFilters({
    useCurrentSemester: true,
  })

  // Filter projects that need professor signing
  const pendingSignatureProjetos = useMemo(() => {
    if (!projetos || !user) return []

    return projetos.filter((projeto) => {
      return projeto.status === PROJETO_STATUS_DRAFT || projeto.status === PROJETO_STATUS_PENDING_SIGNATURE
    })
  }, [projetos, user])

  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!selectedProject) return null

    // Extract atividades descriptions from the project
    const atividadesFromProject = selectedProject.atividades || []
    const atividades: string[] = atividadesFromProject.map((a: { descricao: string } | string) => {
      if (typeof a === "string") return a
      return a.descricao
    })

    return {
      titulo: selectedProject.titulo,
      descricao: selectedProject.descricao,
      departamento: selectedProject.departamento
        ? {
            id: selectedProject.departamento.id,
            nome: selectedProject.departamento.nome,
          }
        : undefined,
      coordenadorResponsavel: "Coordenador",
      professorResponsavel: selectedProject.professorResponsavel
        ? {
            id: selectedProject.professorResponsavel.id,
            nomeCompleto: selectedProject.professorResponsavel.nomeCompleto,
            nomeSocial: selectedProject.professorResponsavel.nomeSocial,
            genero: selectedProject.professorResponsavel.genero,
            cpf: selectedProject.professorResponsavel.cpf,
            matriculaSiape: selectedProject.professorResponsavel.matriculaSiape,
            emailInstitucional: selectedProject.professorResponsavel.emailInstitucional,
            regime: selectedProject.professorResponsavel.regime,
            telefone: selectedProject.professorResponsavel.telefone,
            telefoneInstitucional: selectedProject.professorResponsavel.telefoneInstitucional,
          }
        : undefined,
      ano: selectedProject.ano,
      semestre: selectedProject.semestre,
      tipoProposicao: selectedProject.tipoProposicao,
      bolsasSolicitadas: selectedProject.bolsasSolicitadas || 0,
      voluntariosSolicitados: selectedProject.voluntariosSolicitados || 0,
      cargaHorariaSemana: selectedProject.cargaHorariaSemana,
      numeroSemanas: selectedProject.numeroSemanas,
      publicoAlvo: selectedProject.publicoAlvo,
      estimativaPessoasBenificiadas: selectedProject.estimativaPessoasBenificiadas || 0,
      disciplinas: selectedProject.disciplinas || [],
      atividades,
      user: {
        username: user?.username,
        email: user?.email,
        nomeCompleto: user?.username,
        role: user?.role,
      },
      assinaturaProfessor: selectedProject.assinaturaProfessor || undefined,
      dataAssinaturaProfessor: selectedProject.assinaturaProfessor ? new Date().toLocaleDateString("pt-BR") : undefined,
      projetoId: selectedProject.id,
      signingMode: SIGNING_MODE_PROFESSOR,
    }
  }, [selectedProject, user])

  const handleBackToList = () => {
    // Check if user came from dashboard
    const cameFromDashboard = referrerRef.current?.includes("/home/professor/dashboard")

    if (cameFromDashboard) {
      router.push("/home/professor/dashboard")
    } else {
      // Just clear the selection to show the list
      setSelectedProjectId(null)
    }
  }

  const handleSignComplete = () => {
    // Invalidate all project queries to refresh lists across the app
    apiUtils.projeto.getProjetos.invalidate()
    apiUtils.projeto.getProjetosFiltered.invalidate()
    apiUtils.projeto.getProjeto.invalidate()
    setSelectedProjectId(null)
  }

  const handleSelectProject = (projetoId: number) => {
    setSelectedProjectId(projetoId)
  }

  // Column definitions for the projects table
  const colunasProjetos: ColumnDef<DashboardProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente Curricular
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        const nomeDisciplina = disciplinas.length > 0 ? disciplinas[0].nome : row.original.titulo
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{codigoDisciplina}</span>
            <p className="text-sm text-gray-500">{nomeDisciplina}</p>
          </div>
        )
      },
    },
    {
      header: createFilterableHeader<DashboardProjectItem>({
        title: "Status",
        filterType: "multiselect",
        filterOptions: statusFilterOptions,
      }),
      accessorKey: "status",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => {
        const status = row.original.status
        if (status === PROJETO_STATUS_DRAFT) {
          return <Badge variant="outline">Rascunho</Badge>
        } else if (status === PROJETO_STATUS_PENDING_SIGNATURE) {
          return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Aguardando Assinatura
            </Badge>
          )
        }
        return <Badge variant="outline">{status}</Badge>
      },
    },
    {
      header: createFilterableHeader<DashboardProjectItem>({
        title: "Ano",
        filterType: "multiselect",
        filterOptions: createYearFilterOptions(),
      }),
      accessorKey: "ano",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <div className="text-center">{row.original.ano}</div>,
    },
    {
      header: createFilterableHeader<DashboardProjectItem>({
        title: "Semestre",
        filterType: "multiselect",
        filterOptions: createSemesterFilterOptions(),
      }),
      accessorKey: "semestre",
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <div className="text-center">{row.original.semestre === SEMESTRE_1 ? "1º" : "2º"}</div>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: "voluntariosSolicitados",
      cell: ({ row }) => {
        const voluntarios = row.original.voluntariosSolicitados ?? 0
        return <div className="text-center text-green-600 font-medium">{voluntarios}</div>
      },
    },
    {
      header: "Ações",
      accessorKey: "acoes",
      cell: ({ row }) => {
        const projeto = row.original

        return (
          <Button variant="primary" size="sm" onClick={() => handleSelectProject(projeto.id)}>
            <FileSignature className="h-4 w-4 mr-2" />
            Assinar Projeto
          </Button>
        )
      },
    },
  ]

  if (user?.role !== PROFESSOR) {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Apenas professores podem acessar esta página.</p>
        </div>
      </PagesLayout>
    )
  }

  // Show signing interface if a project is selected
  if (selectedProjectId && templateData) {
    return (
      <PagesLayout title="Assinatura de Projeto" subtitle={`Assine o projeto: ${templateData.titulo}`}>
        <div className="mb-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {loadingProject ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando projeto...</span>
          </div>
        ) : (
          <InteractiveProjectPDF formData={templateData} userRole="professor" onSignatureComplete={handleSignComplete} />
        )}
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Assinatura de Documentos"
      subtitle="Visualize e assine seus projetos de monitoria"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : pendingSignatureProjetos.length > 0 ? (
        <TableComponent
          columns={colunasProjetos}
          data={pendingSignatureProjetos}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto aguardando assinatura</h3>
          <p className="text-muted-foreground">
            Todos os seus projetos foram assinados ou não há projetos em rascunho.
          </p>
        </div>
      )}

      {/* Instructions Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como Funciona o Processo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            <p className="text-sm text-blue-800">Clique em "Assinar Projeto" para visualizar o PDF</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            <p className="text-sm text-blue-800">Clique em "Assinar como Professor" para abrir o modal</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            <p className="text-sm text-blue-800">Desenhe sua assinatura e clique em "Salvar"</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            <p className="text-sm text-green-800">O documento será submetido para análise do administrador</p>
          </div>
        </div>
      </div>
    </PagesLayout>
  )
}

export default function DocumentSigningPage() {
  return (
    <Suspense
      fallback={
        <PagesLayout title="Assinatura de Documentos">
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </div>
        </PagesLayout>
      }
    >
      <DocumentSigningContent />
    </Suspense>
  )
}
