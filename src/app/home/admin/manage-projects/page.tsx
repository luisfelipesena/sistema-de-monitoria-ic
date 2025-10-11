"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FilterModal, type FilterValues } from "@/components/ui/FilterModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ManageProjectItem } from "@/types"
import { api } from "@/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText,
  Filter,
  Hand,
  List,
  Loader,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export default function ManageProjectsPage() {
  const { toast } = useToast()

  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  // Inicializar com semestre atual
  const getCurrentSemester = () => {
    const now = new Date()
    const currentYear = now.getFullYear().toString()
    const currentSemester = now.getMonth() < 6 ? "SEMESTRE_1" : "SEMESTRE_2"
    return { ano: currentYear, semestre: currentSemester }
  }
  const [filters, setFilters] = useState<FilterValues>(getCurrentSemester())
  const [groupedView, setGroupedView] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ManageProjectItem | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showProjectFilesDialog, setShowProjectFilesDialog] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState("")
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)

  const approveProjectMutation = api.projeto.approveProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Projeto aprovado! Agora pendente de assinatura administrativa.",
      })
      queryClient.invalidateQueries()
      setShowPreviewDialog(false)
      setSelectedProject(null)
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao aprovar projeto: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const rejectProjectMutation = api.projeto.rejectProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Projeto rejeitado!",
      })
      queryClient.invalidateQueries()
      setShowRejectDialog(false)
      setSelectedProject(null)
      setRejectFeedback("")
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao rejeitar projeto: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const deleteProjectMutation = api.projeto.deleteProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Projeto removido com sucesso!",
      })
      queryClient.invalidateQueries()
      setShowDeleteDialog(false)
      setSelectedProject(null)
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover projeto: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()
  const getAdminFilePresignedUrlMutation = api.file.getAdminFilePresignedUrl.useMutation()
  const { data: projectFiles, isLoading: loadingProjectFiles } = api.file.getProjetoFiles.useQuery(
    { projetoId: selectedProject?.id || 0 },
    { enabled: showProjectFilesDialog && !!selectedProject?.id }
  )

  const handleViewProjectFiles = (projeto: ManageProjectItem) => {
    setSelectedProject(projeto)
    setShowProjectFilesDialog(true)
  }

  const handleDownloadFile = async (objectName: string) => {
    try {
      const presignedUrl = await getAdminFilePresignedUrlMutation.mutateAsync({ objectName })

      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = presignedUrl.url
      link.download = objectName.split("/").pop() || "file"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso!",
        description: "Download iniciado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar arquivo",
        variant: "destructive",
      })
      console.error("Download error:", error)
    }
  }

  const handlePreviewProject = async (projeto: ManageProjectItem) => {
    setSelectedProject(projeto)
    setShowPreviewDialog(true)
  }

  const handleViewProjectPDF = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      toast({
        title: "Preparando visualização...",
        description: "Preparando visualização do PDF...",
      })

      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId: projetoId,
      })

      // Open PDF in new tab
      window.open(result.url, "_blank")

      toast({
        title: "Sucesso!",
        description: "PDF aberto em nova aba",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o documento para visualização.",
        variant: "destructive",
      })
      console.error("View PDF error:", error)
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  const handleApproveProject = async () => {
    if (!selectedProject) return

    try {
      await approveProjectMutation.mutateAsync({
        id: selectedProject.id,
        feedbackAdmin: "Projeto aprovado pela administração.",
      })
    } catch (error) {
      console.error("Approve project error:", error)
    }
  }

  const handleRejectProject = async () => {
    if (!selectedProject) return

    try {
      await rejectProjectMutation.mutateAsync({
        id: selectedProject.id,
        feedbackAdmin: rejectFeedback || "Projeto rejeitado pela administração.",
      })
    } catch (error) {
      console.error("Reject project error:", error)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    try {
      await deleteProjectMutation.mutateAsync({
        id: selectedProject.id,
      })
    } catch (error) {
      console.error("Delete project error:", error)
    }
  }

  const handleOpenRejectDialog = (projeto: ManageProjectItem) => {
    setSelectedProject(projeto)
    setShowRejectDialog(true)
  }

  const handleOpenDeleteDialog = (projeto: ManageProjectItem) => {
    setSelectedProject(projeto)
    setShowDeleteDialog(true)
  }

  const handleGoToDocumentSigning = () => {
    router.push("/home/admin/assinatura-documentos")
  }

  const handleSignSpecificProject = (projetoId: number) => {
    router.push(`/home/admin/assinatura-documentos?projetoId=${projetoId}`)
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const filteredProjetos = useMemo(() => {
    if (!projetos) return []

    return projetos.filter((projeto) => {
      if (filters.status && projeto.status !== filters.status) return false
      if (filters.departamento && projeto.departamentoId.toString() !== filters.departamento) return false
      if (filters.semestre && projeto.semestre !== filters.semestre) return false
      if (filters.ano && projeto.ano.toString() !== filters.ano) return false
      return true
    })
  }, [projetos, filters])

  const statusCounts = useMemo(() => {
    if (!filteredProjetos)
      return {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      }

    return filteredProjetos.reduce(
      (acc, projeto) => {
        switch (projeto.status) {
          case "DRAFT":
            acc.draft++
            break
          case "SUBMITTED":
            acc.submitted++
            break
          case "APPROVED":
            acc.approved++
            break
          case "REJECTED":
            acc.rejected++
            break
        }
        return acc
      },
      { draft: 0, submitted: 0, approved: 0, rejected: 0 }
    )
  }, [filteredProjetos])

  const colunasProjetos: ColumnDef<ManageProjectItem>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-400" />
          Projeto
        </div>
      ),
      accessorKey: "titulo",
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas
        const codigoDisciplina = disciplinas.length > 0 ? disciplinas[0].codigo : "N/A"
        return (
          <div>
            <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
            <div className="text-xs text-muted-foreground">
              {codigoDisciplina} • {row.original.professorResponsavelNome}
            </div>
            {groupedView && <div className="text-xs text-muted-foreground">{row.original.departamentoNome}</div>}
          </div>
        )
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
            <Badge variant="default" className="bg-green-500">
              Aprovado
            </Badge>
          )
        } else if (status === "REJECTED") {
          return <Badge variant="destructive">Rejeitado</Badge>
        } else if (status === "SUBMITTED") {
          return (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              Em análise
            </Badge>
          )
        } else if (status === "DRAFT") {
          return <Badge variant="outline">Rascunho</Badge>
        }
        return <Badge variant="outline">{status}</Badge>
      },
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Bolsas
        </div>
      ),
      accessorKey: "bolsasDisponibilizadas",
      cell: ({ row }) => {
        const bolsas = row.original.bolsasDisponibilizadas || 0
        return <span>{bolsas}</span>
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
      cell: ({ row }) => <div className="text-center">{row.original.voluntariosSolicitados || 0}</div>,
    },
    {
      header: () => (
        <div className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Inscritos
        </div>
      ),
      accessorKey: "totalInscritos",
      cell: ({ row }) => <div className="text-center text-base">{row.original.totalInscritos}</div>,
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
        const status = row.original.status
        const projeto = row.original

        return (
          <div className="flex items-center gap-2">
            {status === "SUBMITTED" && (
              <Button
                variant="primary"
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => handlePreviewProject(projeto)}
              >
                <Eye className="h-4 w-4" />
                Analisar
              </Button>
            )}

            {(status === "APPROVED" || status === "REJECTED" || status === "DRAFT" || status === "SUBMITTED") && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-1"
                onClick={() => handleViewProjectPDF(projeto.id)}
                disabled={loadingPdfProjetoId === projeto.id}
              >
                <FileText className="h-4 w-4" />
                {loadingPdfProjetoId === projeto.id ? "Carregando..." : "Ver PDF"}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex items-center gap-1 md:hidden"
              onClick={() => handleViewProjectFiles(projeto)}
            >
              <Download className="h-4 w-4" />
              Arquivos
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="rounded-full flex items-center gap-1"
              onClick={() => handleOpenDeleteDialog(projeto)}
              disabled={deleteProjectMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        )
      },
    },
  ]

  const getCurrentSemesterLabel = () => {
    const ano = filters.ano || new Date().getFullYear().toString()
    const semestre = filters.semestre === "SEMESTRE_1" ? "1" : "2"
    return `${ano}.${semestre}`
  }

  const handleSemesterChange = (value: string) => {
    const [ano, semestreNum] = value.split(".")
    const semestre = semestreNum === "1" ? "SEMESTRE_1" : "SEMESTRE_2"
    setFilters((prev) => ({ ...prev, ano, semestre }))
  }

  const dashboardActions = (
    <>
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <span className="text-sm font-medium text-blue-800">Semestre:</span>
        <Select value={getCurrentSemesterLabel()} onValueChange={handleSemesterChange}>
          <SelectTrigger className="w-28 h-8 bg-white border-blue-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024.1">2024.1</SelectItem>
            <SelectItem value="2024.2">2024.2</SelectItem>
            <SelectItem value="2025.1">2025.1</SelectItem>
            <SelectItem value="2025.2">2025.2</SelectItem>
            <SelectItem value="2026.1">2026.1</SelectItem>
            <SelectItem value="2026.2">2026.2</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="secondary" onClick={handleGoToDocumentSigning} className="flex items-center gap-2">
        <FileSignature className="h-4 w-4" />
        Assinatura de Documentos
      </Button>
      <Button variant={groupedView ? "secondary" : "primary"} onClick={() => setGroupedView(!groupedView)}>
        {groupedView ? "Visão Normal" : "Agrupar por Departamento"}
      </Button>
      <Button variant="outline" onClick={() => setFilterModalOpen(true)}>
        <Filter className="w-4 h-4 mr-1" />
        Filtros
      </Button>
    </>
  )

  return (
    <PagesLayout
      title="Gerenciar Projetos"
      subtitle="Administração de projetos de monitoria"
      actions={dashboardActions}
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total de Projetos</CardTitle>
                <List className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{filteredProjetos?.length || 0}</div>
                <p className="text-xs text-blue-600">Todos os projetos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{statusCounts.draft}</div>
                <p className="text-xs text-muted-foreground">Aguardando submissão</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.submitted}</div>
                <p className="text-xs text-muted-foreground">Para aprovação</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pend. Assinatura</CardTitle>
                <FileSignature className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Aguardando assinatura</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                <p className="text-xs text-muted-foreground">Projetos ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <p className="text-xs text-muted-foreground">Requer revisão</p>
              </CardContent>
            </Card>
          </div>

          <TableComponent columns={colunasProjetos} data={filteredProjetos || []} />
        </>
      )}

      <Dialog open={showProjectFilesDialog} onOpenChange={setShowProjectFilesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Arquivos do Projeto</DialogTitle>
            <DialogDescription>{selectedProject && `Projeto: ${selectedProject.titulo}`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingProjectFiles ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando arquivos...</span>
              </div>
            ) : projectFiles && projectFiles.length > 0 ? (
              <div className="space-y-2">
                {projectFiles.map((file) => (
                  <div key={file.objectName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{file.originalFilename}</div>
                      <div className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {file.lastModified.toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(file.objectName)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum arquivo encontrado para este projeto</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectFilesDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Análise do Projeto</DialogTitle>
            <DialogDescription>
              {selectedProject && `Projeto: ${selectedProject.titulo} - ${selectedProject.professorResponsavelNome}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Visualizar Documento</h4>
                <p className="text-sm text-blue-700">
                  Revise o PDF do projeto com a assinatura do professor antes de tomar uma decisão
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => selectedProject && handleViewProjectPDF(selectedProject.id)}
                disabled={selectedProject ? loadingPdfProjetoId === selectedProject.id : false}
              >
                {selectedProject && loadingPdfProjetoId === selectedProject.id ? "Carregando..." : "Abrir PDF"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Etapas do processo:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Visualize o PDF do projeto clicando em "Abrir PDF"</li>
                <li>Analise o conteúdo e a assinatura do professor</li>
                <li>Aprove ou rejeite o projeto usando os botões abaixo</li>
                <li>Se aprovado, o projeto ficará disponível para assinatura administrativa</li>
              </ol>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowPreviewDialog(false)
                selectedProject && handleOpenRejectDialog(selectedProject)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            <Button
              variant="default"
              onClick={handleApproveProject}
              disabled={approveProjectMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {approveProjectMutation.isPending ? "Aprovando..." : "Aprovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Projeto</DialogTitle>
            <DialogDescription>{selectedProject && `Projeto: ${selectedProject.titulo}`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
              <Textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Descreva os motivos da rejeição para orientar o professor..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectFeedback("")
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectProject} disabled={rejectProjectMutation.isPending}>
              {rejectProjectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Projeto</DialogTitle>
            <DialogDescription>{selectedProject && `Projeto: ${selectedProject.titulo}`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">Atenção! Esta ação é irreversível</h4>
                <p className="text-sm text-red-700 mt-1">
                  O projeto será removido permanentemente do sistema. Todos os dados relacionados, incluindo inscrições
                  e documentos, serão perdidos.
                </p>
                {selectedProject && selectedProject.status === "APPROVED" && (
                  <p className="text-sm text-red-800 mt-2 font-medium">
                    ⚠️ Este projeto está aprovado e pode ter inscrições ativas de estudantes.
                  </p>
                )}
                {selectedProject && selectedProject.totalInscritos > 0 && (
                  <p className="text-sm text-red-800 mt-2 font-medium">
                    📋 Este projeto possui {selectedProject.totalInscritos} inscrição(ões) que também serão removidas.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProjectMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteProjectMutation.isPending ? "Removendo..." : "Confirmar Remoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        type="admin"
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </PagesLayout>
  )
}
