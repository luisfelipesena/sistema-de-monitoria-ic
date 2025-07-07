"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ProfessorProjetoListItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileSignature,
  FileText,
  Plus,
  Users,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ProfessorProjetosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedProjeto, setSelectedProjeto] = useState<ProfessorProjetoListItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const { data: projetosData } = api.projeto.getProjetos.useQuery()
  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()

  const projetos: ProfessorProjetoListItem[] =
    projetosData
      ?.filter((projeto) => projeto.professorResponsavelId === user?.id)
      .map((projeto: any) => ({
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        departamento: {
          id: projeto.departamentoId,
          nome: "Departamento",
        },
        ano: projeto.ano,
        semestre: projeto.semestre,
        tipoProposicao: projeto.tipoProposicao,
        status: projeto.status,
        bolsasSolicitadas: projeto.bolsasSolicitadas,
        voluntariosSolicitados: projeto.voluntariosSolicitados,
        inscricoes: 0,
        bolsasAlocadas: projeto.bolsasDisponibilizadas || 0,
        voluntariosAlocados: 0,
        cargaHorariaSemana: projeto.cargaHorariaSemana,
        numeroSemanas: projeto.numeroSemanas,
        publicoAlvo: projeto.publicoAlvo,
        estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || 0,
        disciplinas: [],
        assinaturaProfessor: projeto.assinaturaProfessor || undefined,
        assinaturaAdmin: projeto.assinaturaAdmin || undefined,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      })) || []

  const handleViewProjeto = (projeto: ProfessorProjetoListItem) => {
    setSelectedProjeto(projeto)
    setIsDetailDialogOpen(true)
  }

  const handleViewPdf = async (projetoId: number) => {
    try {
      toast({
        title: "Preparando visualização...",
        description: "Abrindo PDF do projeto",
      })

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
    } catch (error) {
      toast({
        title: "Erro ao abrir PDF",
        description: "Não foi possível abrir o documento para visualização.",
        variant: "destructive",
      })
      console.error("View PDF error:", error)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Edit className="h-3 w-3" />
            Rascunho
          </Badge>
        )
      case "SUBMITTED":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Em Análise
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        )
      case "PENDING_SIGNATURE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <FileSignature className="h-3 w-3" />
            Aguardando Assinatura
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderTipoProposicaoBadge = (tipo: string) => {
    switch (tipo) {
      case "NOVO":
        return <Badge className="bg-blue-100 text-blue-800">Novo</Badge>
      case "CONTINUACAO":
        return <Badge className="bg-purple-100 text-purple-800">Continuação</Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  const getActionButtons = (projeto: ProfessorProjetoListItem) => {
    const buttons = []

    // View button - always available
    buttons.push(
      <Button key="view" variant="outline" size="sm" onClick={() => handleViewProjeto(projeto)}>
        <Eye className="h-4 w-4 mr-1" />
        Detalhes
      </Button>
    )

    if (projeto.status === "DRAFT") {
      buttons.push(
        <Link key="edit" href={`/home/professor/projetos/${projeto.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </Link>
      )
    }

    if (projeto.status === "DRAFT" || projeto.status === "PENDING_PROFESSOR_SIGNATURE") {
      buttons.push(
        <Link key="sign" href={`/home/professor/assinatura-documentos?projetoId=${projeto.id}`}>
          <Button variant="primary" size="sm">
            <FileSignature className="h-4 w-4 mr-1" />
            Assinar e Submeter
          </Button>
        </Link>
      )
    }

    // PDF view button - for submitted, approved or rejected projects
    if (["SUBMITTED", "APPROVED", "REJECTED", "PENDING_ADMIN_SIGNATURE"].includes(projeto.status)) {
      buttons.push(
        <Button
          key="pdf"
          variant="outline"
          size="sm"
          onClick={() => handleViewPdf(projeto.id)}
          disabled={getProjetoPdfMutation.isPending}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )
    }

    return buttons
  }

  const columns: ColumnDef<ProfessorProjetoListItem>[] = [
    {
      accessorKey: "titulo",
      header: "Projeto",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.departamento.nome} • {row.original.ano}.{row.original.semestre === "SEMESTRE_1" ? "1" : "2"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tipoProposicao",
      header: "Tipo",
      cell: ({ row }) => renderTipoProposicaoBadge(row.original.tipoProposicao),
    },
    {
      id: "vagas",
      header: "Vagas",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="text-sm">
            <Badge variant="outline" className="mr-1">
              {row.original.bolsasSolicitadas} 🏆
            </Badge>
            <Badge variant="outline">{row.original.voluntariosSolicitados} 👥</Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "inscricoes",
      header: "Inscrições",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.original.inscricoes > 0 ? "default" : "outline"}>{row.original.inscricoes}</Badge>
        </div>
      ),
    },
    {
      id: "alocados",
      header: "Alocados",
      cell: ({ row }) => (
        <div className="text-center">
          <div className="text-sm">
            <Badge variant="outline" className="mr-1">
              {row.original.bolsasAlocadas}/{row.original.bolsasSolicitadas}
            </Badge>
            <Badge variant="outline">
              {row.original.voluntariosAlocados}/{row.original.voluntariosSolicitados}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const projeto = row.original
        return <div className="flex items-center gap-2">{getActionButtons(projeto)}</div>
      },
    },
  ]

  const totalProjetos = projetos.length
  const projetosAprovados = projetos.filter((p) => p.status === "APPROVED").length
  const totalBolsas = projetos.reduce((sum, p) => sum + p.bolsasSolicitadas, 0)
  const totalVoluntarios = projetos.reduce((sum, p) => sum + p.voluntariosSolicitados, 0)

  return (
    <PagesLayout title="Meus Projetos de Monitoria" subtitle="Gerencie seus projetos de monitoria">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
                  <div className="text-2xl font-bold">{totalProjetos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                  <div className="text-2xl font-bold text-green-600">{projetosAprovados}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Bolsas Solicitadas</p>
                  <div className="text-2xl font-bold text-blue-600">{totalBolsas}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Voluntários Solicitados</p>
                  <div className="text-2xl font-bold text-purple-600">{totalVoluntarios}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Projetos</h2>

          <Button asChild>
            <Link href="/home/professor/projetos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        </div>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={projetos}
              searchableColumn="titulo"
              searchPlaceholder="Buscar por título do projeto..."
            />
          </CardContent>
        </Card>

        {/* Project Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Projeto</DialogTitle>
              <DialogDescription>Informações completas do projeto de monitoria</DialogDescription>
            </DialogHeader>

            {selectedProjeto && (
              <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                      <p className="text-sm">{selectedProjeto.titulo}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Departamento</Label>
                      <p className="text-sm">{selectedProjeto.departamento.nome}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Período</Label>
                      <p className="text-sm">
                        {selectedProjeto.ano}.{selectedProjeto.semestre === "SEMESTRE_1" ? "1" : "2"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                      <div>{renderTipoProposicaoBadge(selectedProjeto.tipoProposicao)}</div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div>{renderStatusBadge(selectedProjeto.status)}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="text-sm mt-1">{selectedProjeto.descricao}</p>
                  </div>
                </div>

                <Separator />

                {/* Vacancies and Applications */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Vagas e Inscrições</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bolsas Solicitadas</Label>
                      <p className="text-sm">{selectedProjeto.bolsasSolicitadas}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Voluntários Solicitados</Label>
                      <p className="text-sm">{selectedProjeto.voluntariosSolicitados}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total de Inscrições</Label>
                      <p className="text-sm">{selectedProjeto.inscricoes}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bolsas Alocadas</Label>
                      <p className="text-sm">
                        {selectedProjeto.bolsasAlocadas}/{selectedProjeto.bolsasSolicitadas}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Project Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detalhes do Projeto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Carga Horária Semanal</Label>
                      <p className="text-sm">{selectedProjeto.cargaHorariaSemana} horas</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Número de Semanas</Label>
                      <p className="text-sm">{selectedProjeto.numeroSemanas} semanas</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Público Alvo</Label>
                      <p className="text-sm">{selectedProjeto.publicoAlvo}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Pessoas Beneficiadas (Estimativa)
                      </Label>
                      <p className="text-sm">{selectedProjeto.estimativaPessoasBenificiadas}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Disciplines */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Disciplinas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjeto.disciplinas.map((disciplina) => (
                      <Badge key={disciplina.id} variant="outline">
                        {disciplina.nome}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Signatures */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Assinaturas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assinatura do Professor</Label>
                      <div className="mt-1">
                        {selectedProjeto.assinaturaProfessor ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Assinado
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assinatura do Administrador</Label>
                      <div className="mt-1">
                        {selectedProjeto.assinaturaAdmin ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Assinado
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Histórico</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                      <p className="text-sm">{format(new Date(selectedProjeto.criadoEm), "dd/MM/yyyy 'às' HH:mm")}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Última atualização</Label>
                      <p className="text-sm">
                        {format(new Date(selectedProjeto.atualizadoEm), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
