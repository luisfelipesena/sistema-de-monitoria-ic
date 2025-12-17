"use client"

import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { multiselectFilterFn, TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useServerPagination } from "@/hooks/useServerPagination"
import {
  PROFESSOR,
  PROFESSOR_STATUS_ATIVO,
  PROFESSOR_STATUS_INATIVO,
  REGIME_20H,
  REGIME_40H,
  REGIME_DE,
  REGIME_LABELS,
  TIPO_PROFESSOR_EFETIVO,
  TIPO_PROFESSOR_LABELS,
  TIPO_PROFESSOR_SUBSTITUTO,
  type Regime,
  type TipoProfessor,
  type UserListItem,
} from "@/types"
import { api } from "@/utils/api"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Mail, Pencil, Plus, Trash2, UserCheck, Users, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export default function ProfessoresPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<UserListItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [professorToDelete, setProfessorToDelete] = useState<UserListItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [professorToToggle, setProfessorToToggle] = useState<{ professor: UserListItem; isAtivo: boolean } | null>(null)
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nomeCompleto: "",
    departamentoId: "",
    regime: "" as Regime | "",
    tipoProfessor: TIPO_PROFESSOR_EFETIVO as TipoProfessor,
    mensagem: "",
  })

  const PROFESSOR_STATUS_PENDING = "PENDENTE" as const

  // Server-side pagination with URL state persistence
  const { page, pageSize, setPage, setPageSize, columnFilters, setColumnFilters, apiFilters } = useServerPagination({
    defaultPageSize: 20,
  })

  // Fetch professors with server-side filtering (role is always PROFESSOR)
  const {
    data: usersData,
    isLoading,
    refetch,
  } = api.user.getUsers.useQuery({
    role: [PROFESSOR],
    nomeCompleto: apiFilters.nomeCompleto,
    emailInstitucional: apiFilters.emailInstitucional,
    departamentoId: apiFilters.departamentoId,
    regime: apiFilters.regime as Regime[] | undefined,
    tipoProfessor: apiFilters.tipoProfessor as TipoProfessor[] | undefined,
    limit: apiFilters.limit,
    offset: apiFilters.offset,
  })

  const { data: departamentosData } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const inviteProfessorMutation = api.inviteProfessor.sendInvitation.useMutation()
  const updateProfessorStatusMutation = api.user.updateProfessorStatus.useMutation()
  const deleteUserMutation = api.user.deleteUser.useMutation()

  const departamentos = departamentosData || []
  const professores = usersData?.users || []
  const totalCount = usersData?.total ?? 0

  // Filter options
  const departamentoFilterOptions = useMemo(() => {
    return departamentos.map((d) => ({
      value: d.id.toString(),
      label: d.nome,
    }))
  }, [departamentos])

  const regimeFilterOptions = [
    { value: REGIME_20H, label: REGIME_LABELS[REGIME_20H] },
    { value: REGIME_40H, label: REGIME_LABELS[REGIME_40H] },
    { value: REGIME_DE, label: REGIME_LABELS[REGIME_DE] },
  ]

  const tipoProfessorFilterOptions = [
    { value: TIPO_PROFESSOR_EFETIVO, label: TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_EFETIVO] },
    { value: TIPO_PROFESSOR_SUBSTITUTO, label: TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_SUBSTITUTO] },
  ]

  const handleInviteProfessor = async () => {
    try {
      if (!inviteForm.email || !inviteForm.nomeCompleto || !inviteForm.departamentoId || !inviteForm.regime) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      await inviteProfessorMutation.mutateAsync({
        email: inviteForm.email,
        nomeCompleto: inviteForm.nomeCompleto,
        departamentoId: parseInt(inviteForm.departamentoId),
        regime: inviteForm.regime as Regime,
        tipoProfessor: inviteForm.tipoProfessor,
      })

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteForm.email}`,
      })

      setIsInviteDialogOpen(false)
      setInviteForm({
        email: "",
        nomeCompleto: "",
        departamentoId: "",
        regime: "",
        tipoProfessor: TIPO_PROFESSOR_EFETIVO,
        mensagem: "",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive",
      })
    }
  }

  const handleViewProfessor = (professor: UserListItem) => {
    setSelectedProfessor(professor)
    setIsDetailDialogOpen(true)
  }

  const handleToggleStatus = async () => {
    if (!professorToToggle) return

    try {
      const newStatus = professorToToggle.isAtivo ? PROFESSOR_STATUS_INATIVO : PROFESSOR_STATUS_ATIVO

      await updateProfessorStatusMutation.mutateAsync({
        id: professorToToggle.professor.id,
        status: newStatus,
      })

      await refetch()
      setIsToggleDialogOpen(false)
      setProfessorToToggle(null)

      toast({
        title: "Status atualizado",
        description: `Professor ${newStatus === PROFESSOR_STATUS_ATIVO ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProfessor = async () => {
    if (!professorToDelete) return

    try {
      await deleteUserMutation.mutateAsync({ id: professorToDelete.id })

      await refetch()
      setIsDeleteDialogOpen(false)
      setProfessorToDelete(null)

      toast({
        title: "Professor excluído",
        description: "O professor foi excluído com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao excluir professor",
        description: error.message || "Não foi possível excluir o professor",
        variant: "destructive",
      })
    }
  }

  const renderStatusBadge = (status?: string | null) => {
    switch (status) {
      case PROFESSOR_STATUS_ATIVO:
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case PROFESSOR_STATUS_INATIVO:
        return <Badge variant="destructive">Inativo</Badge>
      case PROFESSOR_STATUS_PENDING:
        return <Badge variant="secondary">Pendente</Badge>
      default:
        return <Badge variant="outline">{status ?? "Indefinido"}</Badge>
    }
  }

  // Stats from current page data
  const stats = useMemo(() => {
    return {
      total: totalCount,
      ativos: professores.filter((p) => {
        const status = p.professorProfile?.accountStatus
        return status === "ACTIVE" || status === null || status === undefined
      }).length,
      pendentes: professores.filter((p) => p.professorProfile?.accountStatus === "PENDING").length,
      inativos: professores.filter((p) => p.professorProfile?.accountStatus === "INACTIVE").length,
    }
  }, [professores, totalCount])

  const columns: ColumnDef<UserListItem>[] = useMemo(
    () => [
      {
        id: "nomeCompleto",
        accessorKey: "professorProfile.nomeCompleto",
        header: createFilterableHeader<UserListItem>({
          title: "Nome",
          filterType: "text",
          filterPlaceholder: "Buscar nome...",
          wide: true,
        }),
        cell: ({ row }) => <div className="font-medium">{row.original.professorProfile?.nomeCompleto}</div>,
      },
      {
        id: "emailInstitucional",
        accessorKey: "professorProfile.emailInstitucional",
        header: createFilterableHeader<UserListItem>({
          title: "Email",
          filterType: "text",
          filterPlaceholder: "Buscar email...",
          wide: true,
        }),
        cell: ({ row }) => (
          <div className="text-muted-foreground">{row.original.professorProfile?.emailInstitucional}</div>
        ),
      },
      {
        id: "departamentoId",
        accessorKey: "professorProfile.departamentoId",
        header: createFilterableHeader<UserListItem>({
          title: "Departamento",
          filterType: "multiselect",
          filterOptions: departamentoFilterOptions,
        }),
        filterFn: multiselectFilterFn,
        cell: ({ row }) => {
          const dept = departamentos.find((d) => d.id === row.original.professorProfile?.departamentoId)
          return dept?.nome || "N/A"
        },
      },
      {
        id: "regime",
        accessorKey: "professorProfile.regime",
        header: createFilterableHeader<UserListItem>({
          title: "Regime",
          filterType: "multiselect",
          filterOptions: regimeFilterOptions,
        }),
        filterFn: multiselectFilterFn,
        cell: ({ row }) => (
          <div>
            {row.original.professorProfile?.regime ? (
              <Badge variant="outline">{REGIME_LABELS[row.original.professorProfile.regime as Regime]}</Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        id: "tipoProfessor",
        accessorKey: "professorProfile.tipoProfessor",
        header: createFilterableHeader<UserListItem>({
          title: "Tipo",
          filterType: "multiselect",
          filterOptions: tipoProfessorFilterOptions,
        }),
        filterFn: multiselectFilterFn,
        cell: ({ row }) => {
          const tipoProfessor = row.original.professorProfile?.tipoProfessor
          if (!tipoProfessor) return <span className="text-muted-foreground">-</span>
          return (
            <Badge variant={tipoProfessor === TIPO_PROFESSOR_EFETIVO ? "default" : "secondary"}>
              {TIPO_PROFESSOR_LABELS[tipoProfessor]}
            </Badge>
          )
        },
      },
      {
        accessorKey: "professorProfile.projetos",
        header: "Projetos",
        cell: ({ row }) => <div className="text-center">{row.original.professorProfile?.projetos || 0}</div>,
      },
      {
        accessorKey: "professorProfile.accountStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.professorProfile?.accountStatus
          if (status === "ACTIVE") return renderStatusBadge(PROFESSOR_STATUS_ATIVO)
          if (status === "INACTIVE") return renderStatusBadge(PROFESSOR_STATUS_INATIVO)
          if (status === "PENDING") return renderStatusBadge(PROFESSOR_STATUS_PENDING)
          return renderStatusBadge(PROFESSOR_STATUS_ATIVO) // Default to ATIVO for null/undefined
        },
      },
      {
        accessorKey: "createdAt",
        header: "Cadastrado em",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.createdAt ? format(new Date(row.original.createdAt), "dd/MM/yyyy") : "N/A"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const professor = row.original
          const accountStatus = professor.professorProfile?.accountStatus
          const isAtivo = accountStatus === "ACTIVE" || accountStatus === null || accountStatus === undefined
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                title="Ver detalhes do professor"
                onClick={() => handleViewProfessor(professor)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant={isAtivo ? "secondary" : "default"}
                size="sm"
                title={isAtivo ? "Desativar professor (temporário)" : "Reativar professor"}
                onClick={() => {
                  setProfessorToToggle({ professor, isAtivo })
                  setIsToggleDialogOpen(true)
                }}
              >
                {isAtivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                title="Excluir professor (permanente)"
                onClick={() => {
                  setProfessorToDelete(professor)
                  setIsDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [departamentos, departamentoFilterOptions]
  )

  return (
    <PagesLayout title="Gerenciamento de Professores" subtitle="Gerencie professores e envie convites">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total de Professores</p>
                  <div className="text-2xl font-bold">{stats.total}</div>
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
                  <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
                  <p className="text-xs text-muted-foreground">Na página atual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Mail className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
                  <p className="text-xs text-muted-foreground">Na página atual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <UserX className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                  <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
                  <p className="text-xs text-muted-foreground">Na página atual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Professores</h2>

          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Convidar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Convidar Novo Professor</DialogTitle>
                <DialogDescription>Envie um convite para um professor se juntar à plataforma</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Institucional *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="professor@ufba.br"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={inviteForm.nomeCompleto}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          nomeCompleto: e.target.value,
                        })
                      }
                      placeholder="Nome do professor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departamento">Departamento *</Label>
                    <Select
                      value={inviteForm.departamentoId}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, departamentoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id.toString()}>
                            {dep.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="regime">Regime de Trabalho *</Label>
                    <Select
                      value={inviteForm.regime}
                      onValueChange={(value: Regime) => setInviteForm({ ...inviteForm, regime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={REGIME_20H}>20 horas</SelectItem>
                        <SelectItem value={REGIME_40H}>40 horas</SelectItem>
                        <SelectItem value={REGIME_DE}>Dedicação Exclusiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipoProfessor">Tipo de Professor</Label>
                  <Select
                    value={inviteForm.tipoProfessor}
                    onValueChange={(value: TipoProfessor) => setInviteForm({ ...inviteForm, tipoProfessor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TIPO_PROFESSOR_EFETIVO}>{TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_EFETIVO]}</SelectItem>
                      <SelectItem value={TIPO_PROFESSOR_SUBSTITUTO}>{TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_SUBSTITUTO]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mensagem">Mensagem Personalizada (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={inviteForm.mensagem}
                    onChange={(e) => setInviteForm({ ...inviteForm, mensagem: e.target.value })}
                    placeholder="Adicione uma mensagem personalizada ao convite..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInviteProfessor}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Professors Table */}
        <Card>
          <CardContent className="p-4">
            <TableComponent
              columns={columns}
              data={professores}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
              isLoading={isLoading}
              serverPagination={{
                totalCount,
                pageIndex: page,
                pageSize,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          </CardContent>
        </Card>

        {/* Professor Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Professor</DialogTitle>
            </DialogHeader>

            {selectedProfessor && selectedProfessor.professorProfile && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.nomeCompleto}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Institucional</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.emailInstitucional}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Matrícula SIAPE</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.matriculaSiape || "-"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.telefone || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Departamento</Label>
                    <p className="text-sm">
                      {departamentos.find((d) => d.id === selectedProfessor.professorProfile?.departamentoId)?.nome ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Regime de Trabalho</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.regime ? REGIME_LABELS[selectedProfessor.professorProfile.regime as Regime] : "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo de Professor</Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.tipoProfessor
                        ? TIPO_PROFESSOR_LABELS[selectedProfessor.professorProfile.tipoProfessor]
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div>
                      {(() => {
                        const status = selectedProfessor.professorProfile?.accountStatus
                        if (status === "ACTIVE" || status === null || status === undefined) return renderStatusBadge(PROFESSOR_STATUS_ATIVO)
                        if (status === "INACTIVE") return renderStatusBadge(PROFESSOR_STATUS_INATIVO)
                        if (status === "PENDING") return renderStatusBadge(PROFESSOR_STATUS_PENDING)
                        return renderStatusBadge(PROFESSOR_STATUS_ATIVO)
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Projetos Ativos</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.projetos || 0}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cadastrado em</Label>
                    <p className="text-sm">{format(new Date(selectedProfessor.createdAt!), "dd/MM/yyyy 'às' HH:mm")}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
              {selectedProfessor && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    router.push(`/home/admin/users/${selectedProfessor.id}/edit`)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {professorToToggle?.isAtivo ? "Desativar Professor" : "Reativar Professor"}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {professorToToggle?.isAtivo ? (
                    <>
                      <p>
                        Deseja desativar o professor{" "}
                        <span className="font-semibold">{professorToToggle?.professor.professorProfile?.nomeCompleto}</span>?
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                        <p className="font-medium mb-1">O que acontece ao desativar:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>O professor não poderá acessar o sistema</li>
                          <li>Seus projetos e dados serão preservados</li>
                          <li>Ao fazer login, será direcionado para confirmar seus dados</li>
                          <li>Esta ação pode ser revertida a qualquer momento</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Deseja reativar o professor{" "}
                        <span className="font-semibold">{professorToToggle?.professor.professorProfile?.nomeCompleto}</span>?
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                        <p className="font-medium mb-1">O que acontece ao reativar:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>O professor poderá acessar o sistema normalmente</li>
                          <li>Todos os dados e projetos serão restaurados</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfessorToToggle(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                className={professorToToggle?.isAtivo
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-green-600 hover:bg-green-700"}
                disabled={updateProfessorStatusMutation.isPending}
              >
                {updateProfessorStatusMutation.isPending
                  ? "Processando..."
                  : professorToToggle?.isAtivo
                    ? "Desativar"
                    : "Reativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Professor Permanentemente</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Deseja excluir permanentemente o professor{" "}
                    <span className="font-semibold">{professorToDelete?.professorProfile?.nomeCompleto}</span>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                    <p className="font-medium mb-1">⚠️ Atenção - Esta ação é irreversível:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Todos os projetos do professor serão arquivados</li>
                      <li>O registro do professor será removido do sistema</li>
                      <li>A conta de usuário será excluída</li>
                      <li><strong>Esta ação não pode ser desfeita</strong></li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 Dica: Se você quer apenas bloquear temporariamente o acesso, considere <strong>desativar</strong> o professor ao invés de excluir.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfessorToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfessor}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Excluir Permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PagesLayout>
  )
}
