"use client"

import { InteractiveProjectPDF } from "@/components/features/projects/InteractiveProjectPDF"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ProfessorSigningProjectItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, CheckCircle, Eye, FileSignature, Loader } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

function DocumentSigningContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [showSigningDialog, setShowSigningDialog] = useState(false)

  const { data: projetos, isLoading: loadingProjetos, refetch } = api.projeto.getProjetos.useQuery()
  const { data: projectDetails } = api.projeto.getProjeto.useQuery(
    { id: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )
  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()

  const pendingSignatureProjetos = projetos?.filter((projeto) => projeto.status === "DRAFT") || []

  const handleViewStoredPDF = async (projetoId: number) => {
    toast({
      title: "Preparando visualização...",
    })
    try {
      const result = await getProjetoPdfMutation.mutateAsync({
        projetoId,
      })

      const newWindow = window.open(result.url, "_blank", "noopener,noreferrer")
      if (!newWindow) {
        toast({
          title: "Erro",
          description: "Permita popups para visualizar o PDF em nova aba.",
          variant: "destructive",
        })
        return
      }

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
    }
  }

  const handleSignDocument = (projetoId: number) => {
    setSelectedProjectId(projetoId)
    setShowSigningDialog(true)
  }

  const handleSigningComplete = () => {
    setShowSigningDialog(false)
    setSelectedProjectId(null)
    refetch()
    toast({
      title: "Sucesso!",
      description: "Documento assinado com sucesso!",
    })
  }

  const handleBackToDashboard = () => {
    router.push("/home/professor/dashboard")
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PROFESSOR_SIGNATURE":
        return (
          <Badge variant="secondary" className="bg-purple-500 text-white">
            Aguardando Assinatura
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-500">
            Aprovado
          </Badge>
        )
      case "SUBMITTED":
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Em análise
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const colunasProjetos: ColumnDef<ProfessorSigningProjectItem>[] = [
    {
      header: "Título",
      accessorKey: "titulo",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-base text-gray-900">{row.original.titulo}</span>
          <div className="text-xs text-muted-foreground">{row.original.disciplinas[0]?.codigo || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Departamento",
      accessorKey: "departamentoNome",
    },
    {
      header: "Semestre",
      accessorKey: "semestre",
      cell: ({ row }) => `${row.original.ano}.${row.original.semestre === "SEMESTRE_1" ? "1" : "2"}`,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      header: "Ações",
      accessorKey: "acoes",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleViewStoredPDF(row.original.id)}
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-full flex items-center gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleSignDocument(row.original.id)}
          >
            <FileSignature className="h-4 w-4" />
            Assinar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PagesLayout title="Assinatura de Documentos" subtitle="Gerencie seus projetos que aguardam assinatura">
      <div className="mb-4">
        <Button variant="outline" onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando projetos...</span>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Projetos Aguardando Sua Assinatura
                {pendingSignatureProjetos.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {pendingSignatureProjetos.length} projeto(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingSignatureProjetos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum projeto aguardando assinatura</h3>
                  <p>Todos os seus projetos foram processados ou não há projetos aguardando sua assinatura.</p>
                </div>
              ) : (
                <TableComponent columns={colunasProjetos} data={pendingSignatureProjetos} />
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Como Funciona o Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <p>Visualize o PDF do seu projeto clicando em "Visualizar"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <p>Clique em "Assinar" para assinar digitalmente o documento</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <p>O documento será enviado para análise da administração</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Signing Dialog */}
      <Dialog open={showSigningDialog} onOpenChange={setShowSigningDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinatura Digital - Documento do Projeto</DialogTitle>
          </DialogHeader>
          {projectDetails && (
            <InteractiveProjectPDF
              formData={{
                titulo: projectDetails.titulo,
                descricao: projectDetails.descricao,
                departamento: projectDetails.departamento,
                professorResponsavel: projectDetails.professorResponsavel
                  ? {
                      id: projectDetails.professorResponsavel.id,
                      nomeCompleto: projectDetails.professorResponsavel.nomeCompleto,
                      emailInstitucional: projectDetails.professorResponsavel.emailInstitucional,
                      genero: "OUTRO" as const,
                      cpf: "",
                      regime: "20H" as const,
                    }
                  : undefined,
                ano: projectDetails.ano,
                semestre: projectDetails.semestre,
                tipoProposicao: projectDetails.tipoProposicao,
                bolsasSolicitadas: projectDetails.bolsasSolicitadas || 0,
                voluntariosSolicitados: projectDetails.voluntariosSolicitados || 0,
                cargaHorariaSemana: projectDetails.cargaHorariaSemana,
                numeroSemanas: projectDetails.numeroSemanas,
                publicoAlvo: projectDetails.publicoAlvo,
                estimativaPessoasBenificiadas: projectDetails.estimativaPessoasBenificiadas || undefined,
                disciplinas: projectDetails.disciplinas || [],
                projetoId: projectDetails.id,
              }}
              userRole="professor"
              onSignatureComplete={handleSigningComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}

export default function ProfessorDocumentSigningPage() {
  return <DocumentSigningContent />
}
