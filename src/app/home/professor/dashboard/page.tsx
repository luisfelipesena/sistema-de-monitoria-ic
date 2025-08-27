"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilterModal, FilterValues } from "@/components/ui/FilterModal"
import { useToast } from "@/hooks/use-toast"
import { DashboardProjectItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Download, Eye, FileSignature, Filter, Hand, List, Loader, Plus, Trash2, Users } from "lucide-react"

export default function DashboardProfessor() {
  const { toast } = useToast()
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()
  const deleteProjeto = api.projeto.deleteProjeto.useMutation()
  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projetoToDelete, setProjetoToDelete] = useState<DashboardProjectItem | null>(null)
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)
  const apiUtils = api.useUtils()
  // Aplicar filtros aos projetos
  const projetosFiltrados = useMemo(() => {
    if (!projetos) return []

    return projetos.filter((projeto) => {
      if (filters.status && projeto.status !== filters.status) return false
      if (filters.semestre && projeto.semestre !== filters.semestre) return false
      if (filters.ano && projeto.ano.toString() !== filters.ano) return false
      return true
    })
  }, [projetos, filters])

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleDeleteProjeto = (projeto: DashboardProjectItem) => {
    setProjetoToDelete(projeto)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteProjeto = () => {
    if (!projetoToDelete) return

    deleteProjeto.mutate(
      { id: projetoToDelete.id },
      {
        onSuccess: async () => {
          toast({
            title: "Projeto excluído",
            description: "O projeto foi excluído com sucesso.",
          })
          setDeleteDialogOpen(false)
          setProjetoToDelete(null)
          await apiUtils.projeto.getProjetos.invalidate()
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir projeto",
            description: error.message || "Ocorreu um erro ao excluir o projeto.",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleViewPdf = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId: projetoId,
      })

      const newWindow = window.open(result.url, "_blank", "noopener,noreferrer")
      if (!newWindow) {
        toast({
          title: "Popup bloqueado",
          description: "Permita popups para visualizar o PDF em nova aba.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "PDF aberto em nova aba",
      })
    } catch (error: any) {
      console.error("View PDF error:", error)

      let errorMessage = "Não foi possível abrir o documento para visualização."

      if (error?.message?.includes("PDF do projeto não encontrado")) {
        errorMessage = "PDF não encontrado. O documento pode ainda não ter sido gerado após a assinatura."
      } else if (error?.message?.includes("NOT_FOUND")) {
        errorMessage = "PDF não encontrado. Verifique se o projeto foi assinado corretamente."
      }

      toast({
        title: "Erro ao abrir PDF",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  // Column definitions for the projects table
  const colunasProjetos: ColumnDef<DashboardProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Componente curricular
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        return <span className="font-semibold text-base text-gray-900">{codigoDisciplina}</span>
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Loader className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "APPROVED") {
          return (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Aprovado
            </Badge>
          )
        } else if (status === "REJECTED") {
          return <Badge variant="destructive">Rejeitado</Badge>
        } else if (status === "SUBMITTED") {
          return (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Em análise
            </Badge>
          )
        } else if (status === "DRAFT") {
          return <Badge variant="outline">Rascunho</Badge>
        } else if (status === "PENDING_PROFESSOR_SIGNATURE") {
          return <Badge variant="secondary">Aguardando Assinatura do Professor</Badge>
        } else if (status === "PENDING_ADMIN_SIGNATURE") {
          return (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Aguardando Assinatura do Admin
            </Badge>
          )
        }
        return <Badge variant="outline">{status}</Badge>
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsas
        </div>
      ),
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas ?? 0
        const status = row.original.status
        if (status === "APPROVED") {
          return <span>{bolsas}</span>
        }
        return <span>-</span>
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Hand className="h-5 w-5 text-gray-400" />
          Voluntários
        </div>
      ),
      accessorKey: "voluntariosSolicitados",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "APPROVED") {
          return <div className="text-center">{row.original.voluntariosSolicitados ?? 0}</div>
        }
        return <div className="text-center">-</div>
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: "totalInscritos",
      cell: ({ row }) => {
        const status = row.original.status
        if (status === "APPROVED") {
          return <div className="text-center text-base">{row.original.totalInscritos}</div>
        }
        return <div className="text-center">-</div>
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-400" />
          Ações
        </div>
      ),
      accessorKey: "acoes",
      cell: ({ row }) => {
        const projeto = row.original

        return (
          <div className="flex gap-2">
            {(projeto.status === "DRAFT" || projeto.status === "PENDING_PROFESSOR_SIGNATURE") && (
              <>
                <Link href={`/home/professor/assinatura-documentos?projetoId=${projeto.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1">
                    <FileSignature className="h-4 w-4" />
                    Assinar
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full flex items-center gap-1"
                  onClick={() => handleDeleteProjeto(projeto)}
                  disabled={deleteProjeto.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}

            {(projeto.status === "SUBMITTED" ||
              projeto.status === "PENDING_ADMIN_SIGNATURE" ||
              projeto.status === "APPROVED" ||
              projeto.status === "REJECTED") && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => handleViewPdf(projeto.id)}
                disabled={loadingPdfProjetoId === projeto.id}
                title="Visualizar PDF do projeto assinado"
              >
                <Download className="h-4 w-4" />
                {loadingPdfProjetoId === projeto.id ? "Carregando..." : "Visualizar PDF"}
              </Button>
            )}

            {projeto.status === "APPROVED" && (
              <Link href={`/home/professor/candidatos?projetoId=${projeto.id}`}>
                <Button variant="primary" size="sm" className="rounded-full flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Ver Candidatos
                </Button>
              </Link>
            )}
          </div>
        )
      },
    },
  ]

  // Action buttons
  const dashboardActions = (
    <>
      <Link href="/home/professor/projetos/novo">
        <Button variant="primary" className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </Link>
      <Button variant="outline" className="text-gray-600" onClick={() => setFilterModalOpen(true)}>
        <Filter className="w-4 h-4 mr-1" />
        Filtros
      </Button>
    </>
  )

  return (
    <PagesLayout title="Dashboard" actions={dashboardActions}>
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : projetosFiltrados && projetosFiltrados.length > 0 ? (
        <>
          {filters.status || filters.semestre || filters.ano ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Filtros ativos: {Object.values(filters).filter(Boolean).length}
                </span>
                <Button variant="outline" size="sm" onClick={() => setFilters({})}>
                  Limpar filtros
                </Button>
              </div>
            </div>
          ) : null}
          <TableComponent columns={colunasProjetos} data={projetosFiltrados} />
        </>
      ) : (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {projetos && projetos.length === 0
              ? "Você ainda não criou nenhum projeto de monitoria."
              : "Nenhum projeto corresponde aos filtros selecionados."}
          </p>
          <Link href="/home/professor/projetos/novo">
            <Button>{projetos && projetos.length === 0 ? "Criar Primeiro Projeto" : "Criar Novo Projeto"}</Button>
          </Link>
        </div>
      )}

      {/* Modal de Filtros */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="professor"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto{" "}
              <span className="font-semibold">{projetoToDelete?.disciplinas?.[0]?.codigo || "N/A"}</span>? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setProjetoToDelete(null)
              }}
              disabled={deleteProjeto.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProjeto}
              disabled={deleteProjeto.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjeto.isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PagesLayout>
  )
}
