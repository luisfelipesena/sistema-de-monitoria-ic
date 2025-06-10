"use client"

import { InteractiveProjectPDF } from "@/components/features/projects/InteractiveProjectPDF"
import { MonitoriaFormData } from "@/components/features/projects/MonitoriaFormTemplate"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/utils/api"
import { ArrowLeft, CheckCircle, FileSignature, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

function DocumentSigningComponent() {
  const router = useRouter()
  const { data: user } = api.auth.me.useQuery()

  const {
    data: projetos,
    isLoading: loadingProjetos,
    refetch,
  } = api.projeto.list.useQuery({
    status: ["PENDING_ADMIN_SIGNATURE"],
  })

  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null)

  const { data: selectedProject, isLoading: loadingProject } = api.projeto.getById.useQuery(
    { id: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  const templateData = React.useMemo((): MonitoriaFormData | null => {
    if (!selectedProject) return null

    return {
      titulo: selectedProject.titulo,
      descricao: selectedProject.descricao,
      departamento: selectedProject.departamento
        ? { id: selectedProject.departamento.id, nome: selectedProject.departamento.nome }
        : undefined,
      professorResponsavel: selectedProject.professorResponsavel,
      coordenadorResponsavel: user?.username,
      ano: selectedProject.ano,
      semestre: selectedProject.semestre as any,
      tipoProposicao: selectedProject.tipoProposicao as any,
      bolsasSolicitadas: selectedProject.bolsasSolicitadas,
      voluntariosSolicitados: selectedProject.voluntariosSolicitados,
      cargaHorariaSemana: selectedProject.cargaHorariaSemana,
      numeroSemanas: selectedProject.numeroSemanas,
      publicoAlvo: selectedProject.publicoAlvo,
      estimativaPessoasBenificiadas: selectedProject.estimativaPessoasBenificiadas ?? undefined,
      disciplinas: selectedProject.disciplinas,
      user: {
        username: user?.username,
        email: user?.email,
      },
      projetoId: selectedProject.id,
      dataAprovacao: selectedProject.status === "APPROVED" ? new Date().toLocaleDateString("pt-BR") : undefined,
    }
  }, [selectedProject, user])

  const handleBackToDashboard = () => {
    router.push("/dashboard/admin")
  }

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
        return <Badge variant="warning">Aguardando Assinatura</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (selectedProjectId) {
    return (
      <PagesLayout title="Assinatura de Projeto - Admin" subtitle={`Assine o projeto: ${selectedProject?.titulo}`}>
        <div className="mb-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Button>
        </div>

        {loadingProject || !selectedProject || !templateData ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Carregando projeto...</p>
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
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Carregando projetos...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Projetos Aguardando Assinatura
              {projetos && projetos.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {projetos.length} projeto(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projetos?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum projeto aguardando assinatura</h3>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Professor Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projetos?.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">{projeto.titulo}</TableCell>
                      <TableCell>{projeto.departamentoNome}</TableCell>
                      <TableCell>{projeto.professorResponsavelNome}</TableCell>
                      <TableCell>{renderStatusBadge(projeto.status as string)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" onClick={() => setSelectedProjectId(projeto.id)}>
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
    </PagesLayout>
  )
}

export default DocumentSigningComponent
