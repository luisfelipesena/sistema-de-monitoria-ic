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

  // Filter projects that are DRAFT or PENDING_PROFESSOR_SIGNATURE (need professor signing)
  const pendingSignatureProjetos = useMemo(() => {
    if (!projetos || !user) return []

    return projetos.filter((projeto) => {
      // For professors, show only projects that need professor signature
      return projeto.status === "DRAFT" || projeto.status === "PENDING_PROFESSOR_SIGNATURE"
    })
  }, [projetos, user])

  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!selectedProject) return null

    return {
      titulo: selectedProject.titulo,
      descricao: selectedProject.descricao,
      departamento: {
        id: selectedProject.departamento.id,
        nome: selectedProject.departamento.nome,
      },
      coordenadorResponsavel: "Coordenador",
      professorResponsavel: {
        id: selectedProject.professorResponsavel.id,
        nomeCompleto: selectedProject.professorResponsavel.nomeCompleto,
        genero: "OUTRO" as const,
        cpf: "",
        emailInstitucional: selectedProject.professorResponsavel.emailInstitucional,
        regime: "20H" as const,
        matriculaSiape: selectedProject.professorResponsavel.matriculaSiape || "",
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
      signingMode: "professor",
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
      case "DRAFT":
        return <Badge variant="outline">Aguardando Assinatura Professor</Badge>
      case "PENDING_PROFESSOR_SIGNATURE":
        return <Badge variant="outline">Aguardando Assinatura Professor</Badge>
      case "SUBMITTED":
        return <Badge variant="secondary">Submetido para Análise</Badge>
      case "PENDING_ADMIN_SIGNATURE":
        return <Badge variant="secondary">Aguardando Assinatura Admin</Badge>
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (user?.role !== "professor") {
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
      <PagesLayout title="Assinatura de Projeto - Professor" subtitle={`Assine o projeto: ${templateData.titulo}`}>
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
          <InteractiveProjectPDF
            formData={templateData}
            userRole="professor"
            onSignatureComplete={handleSignComplete}
          />
        )}
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Assinatura de Documentos - Professor" subtitle="Visualize e assine seus projetos de monitoria">
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
              Meus Projetos Aguardando Assinatura
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
                <p>Todos os seus projetos foram assinados ou não há projetos em rascunho aguardando sua assinatura.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Bolsas</TableHead>
                    <TableHead>Voluntários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSignatureProjetos.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">{projeto.titulo}</TableCell>
                      <TableCell>{projeto.departamentoNome}</TableCell>
                      <TableCell>
                        {projeto.ano}.{projeto.semestre === "SEMESTRE_1" ? 1 : 2}
                      </TableCell>
                      <TableCell>{projeto.bolsasSolicitadas || 0}</TableCell>
                      <TableCell>{projeto.voluntariosSolicitados || 0}</TableCell>
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
            <p>Visualize o PDF do seu projeto clicando em "Assinar Projeto"</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p>Clique em "Assinar como Professor" para abrir o modal de assinatura</p>
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
            <p>O documento será automaticamente assinado e submetido para análise do administrador</p>
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
