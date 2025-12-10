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
import { useUrlColumnFilters } from "@/hooks/useUrlColumnFilters"
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
  type UserListItem,
} from "@/types"
import { api } from "@/utils/api"
import type { ColumnDef, FilterFn } from "@tanstack/react-table"
import { format } from "date-fns"
import { Eye, Mail, Pencil, Plus, Trash2, UserCheck, Users, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

// Custom filter function for professor name (searches nomeCompleto)
const nomeFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const nomeCompleto = row.original.professorProfile?.nomeCompleto || ""
  const searchValue = String(filterValue).toLowerCase()
  return nomeCompleto.toLowerCase().includes(searchValue)
}

// Custom filter function for email
const emailFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const email = row.original.professorProfile?.emailInstitucional || row.original.email || ""
  const searchValue = String(filterValue).toLowerCase()
  return email.toLowerCase().includes(searchValue)
}

// Custom filter function for departamento (multiselect by departamento id)
const departamentoFilterFn: FilterFn<UserListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true
  const departamentoId = row.original.professorProfile?.departamentoId?.toString()
  return departamentoId ? filterValue.includes(departamentoId) : false
}

export default function ProfessoresPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedProfessor, setSelectedProfessor] = useState<UserListItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [professorToDelete, setProfessorToDelete] = useState<UserListItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nomeCompleto: "",
    departamentoId: "",
    regime: "" as Regime | "",
    mensagem: "",
  })

  const PROFESSOR_STATUS_PENDING = "PENDENTE" as const

  // URL-based column filters
  const { columnFilters, setColumnFilters } = useUrlColumnFilters()

  // Fetch professors data
  const {
    data: usersData,
    isLoading,
    refetch,
  } = api.user.getUsers.useQuery({
    role: PROFESSOR,
    limit: 100,
  })

  const { data: departamentosData } = api.departamento.getDepartamentos.useQuery({ includeStats: false })
  const inviteProfessorMutation = api.inviteProfessor.sendInvitation.useMutation()
  const updateProfessorStatusMutation = api.user.updateProfessorStatus.useMutation()
  const deleteUserMutation = api.user.deleteUser.useMutation()

  const departamentos = departamentosData || []

  const professores = usersData?.users.filter((u) => u.role === PROFESSOR) || []

  // Generate filter options for autocomplete
  const nomeFilterOptions = useMemo(() => {
    return professores
      .filter((p) => p.professorProfile?.nomeCompleto)
      .map((p) => ({
        value: p.professorProfile!.nomeCompleto,
        label: p.professorProfile!.nomeCompleto,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [professores])

  const emailFilterOptions = useMemo(() => {
    return professores
      .filter((p) => p.professorProfile?.emailInstitucional)
      .map((p) => ({
        value: p.professorProfile!.emailInstitucional!,
        label: p.professorProfile!.emailInstitucional!,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [professores])

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

  const handleToggleStatus = async (
    professorId: number,
    currentStatus: typeof PROFESSOR_STATUS_ATIVO | typeof PROFESSOR_STATUS_INATIVO
  ) => {
    try {
      const newStatus = currentStatus === PROFESSOR_STATUS_ATIVO ? PROFESSOR_STATUS_INATIVO : PROFESSOR_STATUS_ATIVO

      await updateProfessorStatusMutation.mutateAsync({
        id: professorId,
        status: newStatus,
      })

      await refetch()

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
          autocompleteOptions: nomeFilterOptions,
        }),
        filterFn: nomeFilterFn,
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
          autocompleteOptions: emailFilterOptions,
        }),
        filterFn: emailFilterFn,
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
        filterFn: departamentoFilterFn,
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
        accessorKey: "professorProfile.status",
        header: "Status",
        cell: ({ row }) =>
          renderStatusBadge(row.original.professorProfile?.projetos ? PROFESSOR_STATUS_ATIVO : PROFESSOR_STATUS_INATIVO),
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
          const isAtivo = !!professor.professorProfile?.projetos
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
                variant={isAtivo ? "destructive" : "default"}
                size="sm"
                title={isAtivo ? "Desativar professor" : "Ativar professor"}
                onClick={() => handleToggleStatus(professor.id, isAtivo ? PROFESSOR_STATUS_ATIVO : PROFESSOR_STATUS_INATIVO)}
              >
                {isAtivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                title="Excluir professor"
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
    [departamentos, nomeFilterOptions, emailFilterOptions, departamentoFilterOptions]
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
                  <div className="text-2xl font-bold">{professores.length}</div>
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
                  <div className="text-2xl font-bold text-green-600">
                    {professores.filter((p) => p.professorProfile?.projetos).length}
                  </div>
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
                  <div className="text-2xl font-bold text-yellow-600">{0}</div>
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
                  <div className="text-2xl font-bold text-red-600">
                    {professores.filter((p) => !p.professorProfile?.projetos).length}
                  </div>
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
                    <p className="text-sm">{selectedProfessor.professorProfile.regime || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div>
                      {renderStatusBadge(
                        selectedProfessor.professorProfile?.projetos ? PROFESSOR_STATUS_ATIVO : PROFESSOR_STATUS_INATIVO
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Projetos Ativos</Label>
                    <p className="text-sm">{selectedProfessor.professorProfile.projetos || 0}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cadastrado em</Label>
                  <p className="text-sm">{format(new Date(selectedProfessor.createdAt!), "dd/MM/yyyy 'às' HH:mm")}</p>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o professor{" "}
                <span className="font-semibold">{professorToDelete?.professorProfile?.nomeCompleto}</span>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfessorToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfessor}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PagesLayout>
  )
}
