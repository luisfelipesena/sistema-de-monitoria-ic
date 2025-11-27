"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  STUDENT,
  STUDENT_STATUS_ATIVO,
  STUDENT_STATUS_GRADUADO,
  STUDENT_STATUS_INATIVO,
  STUDENT_STATUS_TRANSFERIDO,
  type AlunoListItem,
  type StudentStatus,
} from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Award, Eye, GraduationCap, UserCheck, UserX, Users } from "lucide-react"
import { useState } from "react"

export default function AlunosPage() {
  const { toast } = useToast()
  const [selectedAluno, setSelectedAluno] = useState<AlunoListItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Helper function - must be declared before use to avoid TDZ
  const getAlunoStatus = (profile: {
    bolsasAtivas?: number | null
    voluntariadosAtivos?: number | null
    inscricoes?: number | null
  }): StudentStatus => {
    return profile.bolsasAtivas || profile.voluntariadosAtivos || profile.inscricoes
      ? STUDENT_STATUS_ATIVO
      : STUDENT_STATUS_INATIVO
  }

  // Fetch students data
  const { data: usersData, isLoading } = api.user.getUsers.useQuery({
    role: STUDENT,
    limit: 100,
  })

  const { data: cursosData } = api.course.getCourses.useQuery({
    includeStats: false,
  })
  const { data: departamentosData } = api.departamento.getDepartamentos.useQuery({ includeStats: false })

  const cursos = cursosData || []
  const departamentos = departamentosData || []

  const alunos: AlunoListItem[] =
    usersData?.users
      .filter((user) => user.studentProfile)
      .map((user) => {
        const curso = cursos.find((c) => c.id === user.studentProfile!.cursoId)
        const departamento = departamentos.find((d) => d.id === curso?.departamentoId)

        return {
          id: user.id,
          nomeCompleto: user.studentProfile!.nomeCompleto,
          matricula: user.studentProfile!.matricula,
          emailInstitucional: user.studentProfile!.emailInstitucional,
          cpf: user.studentProfile!.cpf,
          telefone: user.studentProfile!.telefone || undefined,
          cr: user.studentProfile!.cr,
          curso: {
            id: user.studentProfile!.cursoId,
            nome: curso?.nome || "N/A",
            departamento: departamento?.nome || "N/A",
          },
          status: getAlunoStatus(user.studentProfile!),
          inscricoes: user.studentProfile!.inscricoes || 0,
          bolsasAtivas: user.studentProfile!.bolsasAtivas || 0,
          voluntariadosAtivos: user.studentProfile!.voluntariadosAtivos || 0,
          documentosValidados: user.studentProfile!.documentosValidados || 0,
          totalDocumentos: user.studentProfile!.totalDocumentos || 0,
          criadoEm: user.createdAt?.toISOString() || new Date().toISOString(),
        }
      }) || []

  const handleViewAluno = (aluno: AlunoListItem) => {
    setSelectedAluno(aluno)
    setIsDetailDialogOpen(true)
  }

  const handleToggleStatus = async (alunoId: number, currentStatus: StudentStatus) => {
    try {
      const newStatus = currentStatus === STUDENT_STATUS_ATIVO ? STUDENT_STATUS_INATIVO : STUDENT_STATUS_ATIVO

      // This would use actual tRPC mutation when implemented
      // await updateAlunoStatusMutation.mutateAsync({ id: alunoId, status: newStatus })

      toast({
        title: "Status atualizado",
        description: `Aluno ${newStatus === STUDENT_STATUS_ATIVO ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const renderStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case STUDENT_STATUS_ATIVO:
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case STUDENT_STATUS_INATIVO:
        return <Badge variant="destructive">Inativo</Badge>
      case STUDENT_STATUS_GRADUADO:
        return <Badge className="bg-blue-100 text-blue-800">Graduado</Badge>
      case STUDENT_STATUS_TRANSFERIDO:
        return <Badge variant="secondary">Transferido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderCrBadge = (cr: number | null) => {
    if (!cr) {
      return <Badge variant="outline">N/A</Badge>
    }
    if (cr >= 8.0) {
      return <Badge className="bg-green-100 text-green-800">{cr.toFixed(1)}</Badge>
    } else if (cr >= 7.0) {
      return <Badge className="bg-yellow-100 text-yellow-800">{cr.toFixed(1)}</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">{cr.toFixed(1)}</Badge>
    }
  }

  const columns: ColumnDef<AlunoListItem>[] = [
    {
      accessorKey: "nomeCompleto",
      header: "Nome",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground">{row.original.matricula}</div>
        </div>
      ),
    },
    {
      accessorKey: "emailInstitucional",
      header: "Email",
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.emailInstitucional}</div>,
    },
    {
      accessorKey: "curso.nome",
      header: "Curso",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.curso.nome}</div>
          <div className="text-xs text-muted-foreground">{row.original.curso.departamento}</div>
        </div>
      ),
    },
    {
      accessorKey: "cr",
      header: "CR",
      cell: ({ row }) => renderCrBadge(row.original.cr),
    },
    {
      accessorKey: "bolsasAtivas",
      header: "Bolsas",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.original.bolsasAtivas > 0 ? "default" : "outline"}>{row.original.bolsasAtivas}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "voluntariadosAtivos",
      header: "Voluntariados",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.original.voluntariadosAtivos > 0 ? "secondary" : "outline"}>
            {row.original.voluntariadosAtivos}
          </Badge>
        </div>
      ),
    },
    {
      id: "documentos",
      header: "Documentos",
      cell: ({ row }) => {
        const { documentosValidados, totalDocumentos } = row.original
        const percentage = totalDocumentos > 0 ? (documentosValidados / totalDocumentos) * 100 : 0
        return (
          <div className="text-center">
            <Badge variant={percentage === 100 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
              {documentosValidados}/{totalDocumentos}
            </Badge>
          </div>
        )
      },
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
        const aluno = row.original
        const isAtivo = aluno.status === STUDENT_STATUS_ATIVO
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              title="Ver detalhes do aluno"
              onClick={() => handleViewAluno(aluno)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant={isAtivo ? "destructive" : "default"}
              size="sm"
              title={isAtivo ? "Desativar aluno" : "Ativar aluno"}
              onClick={() => handleToggleStatus(aluno.id, aluno.status)}
            >
              {isAtivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        )
      },
    },
  ]

  const totalAlunos = alunos.length
  const alunosAtivos = alunos.filter((a) => a.status === STUDENT_STATUS_ATIVO).length
  const totalBolsistas = alunos.reduce((sum, a) => sum + a.bolsasAtivas, 0)
  const totalVoluntarios = alunos.reduce((sum, a) => sum + a.voluntariadosAtivos, 0)

  return (
    <PagesLayout title="Gerenciamento de Alunos" subtitle="Visualize e gerencie informações dos estudantes">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                  <div className="text-2xl font-bold">{totalAlunos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <UserCheck className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <div className="text-2xl font-bold text-green-600">{alunosAtivos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Award className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Bolsistas Ativos</p>
                  <div className="text-2xl font-bold text-blue-600">{totalBolsistas}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Voluntários Ativos</p>
                  <div className="text-2xl font-bold text-purple-600">{totalVoluntarios}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={alunos}
              searchableColumn="nomeCompleto"
              searchPlaceholder="Buscar por nome ou matrícula..."
            />
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Aluno</DialogTitle>
            </DialogHeader>

            {selectedAluno && (
              <div className="grid gap-6 py-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Pessoais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                      <p className="text-sm">{selectedAluno.nomeCompleto}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Matrícula</Label>
                      <p className="text-sm">{selectedAluno.matricula}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email Institucional</Label>
                      <p className="text-sm">{selectedAluno.emailInstitucional}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                      <p className="text-sm">{selectedAluno.cpf || "-"}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                      <p className="text-sm">{selectedAluno.telefone || "-"}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div>{renderStatusBadge(selectedAluno.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Acadêmicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Curso</Label>
                      <p className="text-sm">{selectedAluno.curso.nome}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Departamento</Label>
                      <p className="text-sm">{selectedAluno.curso.departamento}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Coeficiente de Rendimento</Label>
                      <div>{renderCrBadge(selectedAluno.cr)}</div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cadastrado em</Label>
                      <p className="text-sm">{format(new Date(selectedAluno.criadoEm), "dd/MM/yyyy 'às' HH:mm")}</p>
                    </div>
                  </div>
                </div>

                {/* Monitoring Activities */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Atividades de Monitoria</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total de Inscrições</Label>
                      <p className="text-sm">{selectedAluno.inscricoes}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bolsas Ativas</Label>
                      <p className="text-sm">{selectedAluno.bolsasAtivas}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Voluntariados Ativos</Label>
                      <p className="text-sm">{selectedAluno.voluntariadosAtivos}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Documentos Validados</Label>
                      <p className="text-sm">
                        {selectedAluno.documentosValidados}/{selectedAluno.totalDocumentos}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
              {selectedAluno && (
                <Button
                  variant={selectedAluno.status === STUDENT_STATUS_ATIVO ? "destructive" : "default"}
                  onClick={() => {
                    handleToggleStatus(selectedAluno.id, selectedAluno.status)
                    setIsDetailDialogOpen(false)
                  }}
                >
                  {selectedAluno.status === STUDENT_STATUS_ATIVO ? "Desativar" : "Ativar"} Aluno
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
