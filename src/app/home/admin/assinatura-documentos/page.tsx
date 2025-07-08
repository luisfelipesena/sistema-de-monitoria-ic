"use client"

import { InteractiveProjectPDF } from "@/components/features/projects/InteractiveProjectPDF"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { MonitoriaFormData } from "@/types"
import { api } from "@/utils/api"
import { ArrowLeft, CheckCircle, FileSignature } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"

function DocumentSigningContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projetoId")
  const { data: projetos, isLoading: loadingProjetos, refetch } = api.projeto.getProjetos.useQuery()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projectId ? parseInt(projectId) : null)

  const { data: selectedProject, isLoading: loadingProject } = api.projeto.getProjeto.useQuery(
    { id: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  )

  // Filter projects that are PENDING_ADMIN_SIGNATURE (approved but need admin signing)
  const pendingSignatureProjetos = useMemo(() => {
    return projetos?.filter((projeto) => projeto.status === "PENDING_ADMIN_SIGNATURE") || []
  }, [projetos])

  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!selectedProject) return null

    return {
      titulo: selectedProject.titulo,
      descricao: selectedProject.descricao,
      departamento: {
        id: selectedProject.departamento?.id || 0,
        nome: selectedProject.departamento?.nome || "",
      },
      coordenadorResponsavel: user?.username || "Coordenador",
      professorResponsavel: {
        id: selectedProject.professorResponsavel?.id || 0,
        nomeCompleto: selectedProject.professorResponsavel?.nomeCompleto || "",
        genero: "OUTRO" as const,
        cpf: "",
        emailInstitucional: selectedProject.professorResponsavel?.emailInstitucional || "",
        regime: "20H" as const,
        matriculaSiape: "",
        telefone: "",
        telefoneInstitucional: "",
      },
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
      user: {
        username: user?.username,
        email: user?.email,
        nomeCompleto: user?.username,
        role: user?.role,
      },
      projetoId: selectedProject.id,
      assinaturaProfessor: selectedProject.assinaturaProfessor || undefined,
      dataAprovacao: selectedProject.status === "APPROVED" ? new Date().toLocaleDateString("pt-BR") : undefined,
    }
  }, [selectedProject, user])

  const handleBackToList = () => {
    setSelectedProjectId(null)
  }

  const handleSignComplete = () => {
    refetch()
    setSelectedProjectId(null)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_ADMIN_SIGNATURE":
        return (
          <Badge className="bg-[hsl(var(--pending))] text-[hsl(var(--pending-foreground))]">
            Aguardando Assinatura Admin
          </Badge>
        )
      case "SUBMITTED":
        return <Badge variant="secondary">Em Análise</Badge>
      case "DRAFT":
        return <Badge variant="outline">Rascunho</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (user?.role !== "admin") {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        </div>
      </PagesLayout>
    )
  }

  // Show signing interface if a project is selected
  if (selectedProjectId && templateData) {
    return (
      <PagesLayout title="Assinatura de Projeto - Admin" subtitle={`Assine o projeto: ${templateData.titulo}`}>
        <div className="mb-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Button>
        </div>

        {loadingProject ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Carregando projeto...</p>
            </div>
          </div>
        ) : (
          <InteractiveProjectPDF formData={templateData} userRole="admin" onSignatureComplete={handleSignComplete} />
        )}
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Assinatura de Documentos - Admin"
      subtitle="Gerencie projetos de monitoria que aguardam assinatura administrativa"
    >
      {loadingProjetos ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando projetos...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Projetos Aguardando Assinatura Administrativa
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
                <p>Todos os projetos foram processados ou não há projetos aprovados aguardando assinatura.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Professor Responsável</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSignatureProjetos.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">{projeto.titulo}</TableCell>
                      <TableCell>{projeto.departamentoNome}</TableCell>
                      <TableCell>{projeto.professorResponsavelNome}</TableCell>
                      <TableCell>
                        {projeto.ano}.{projeto.semestre === "SEMESTRE_1" ? 1 : 2}
                      </TableCell>
                      <TableCell>{renderStatusBadge(projeto.status)}</TableCell>
                      <TableCell>
                        <Button variant="primary" size="sm" onClick={() => setSelectedProjectId(projeto.id)}>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Assinar Projeto
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Como Funciona o Processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p>Visualize o PDF do projeto clicando em "Assinar Projeto"</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p>Clique em "Assinar como Coordenador" para abrir o modal de assinatura</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <p>Desenhe sua assinatura e clique em "Salvar Assinatura"</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>O documento será automaticamente assinado e o projeto aprovado</p>
          </div>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}

export default function DocumentSigningPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DocumentSigningContent />
    </Suspense>
  )
}
