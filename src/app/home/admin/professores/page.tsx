"use client";

import { PagesLayout } from "@/components/layout/PagesLayout";
import { TableComponent } from "@/components/layout/TableComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserListItem as Professor } from "@/types";
import { api } from "@/utils/api";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, Mail, Plus, UserCheck, Users, UserX } from "lucide-react";
import { useState } from "react";

export default function ProfessoresPage() {
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nomeCompleto: "",
    departamentoId: "",
    regime: "" as "20H" | "40H" | "DE" | "",
    mensagem: "",
  });

  // Fetch professors data
  const {
    data: usersData,
    isLoading,
    refetch,
  } = api.user.getUsers.useQuery({
    role: "professor",
    limit: 100,
  });

  const { data: departamentosData } =
    api.departamento.getDepartamentos.useQuery({ includeStats: false });
  const inviteProfessorMutation =
    api.inviteProfessor.sendInvitation.useMutation();
  const updateProfessorStatusMutation =
    api.user.updateProfessorStatus.useMutation();

  const departamentos = departamentosData || [];

  const professores: Professor[] =
    usersData?.users.filter((u) => u.role === "professor") || [];

  const handleInviteProfessor = async () => {
    try {
      if (
        !inviteForm.email ||
        !inviteForm.nomeCompleto ||
        !inviteForm.departamentoId ||
        !inviteForm.regime
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await inviteProfessorMutation.mutateAsync({
        email: inviteForm.email,
      });

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteForm.email}`,
      });

      setIsInviteDialogOpen(false);
      setInviteForm({
        email: "",
        nomeCompleto: "",
        departamentoId: "",
        regime: "",
        mensagem: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Não foi possível enviar o convite",
        variant: "destructive",
      });
    }
  };

  const handleViewProfessor = (professor: Professor) => {
    setSelectedProfessor(professor);
    setIsDetailDialogOpen(true);
  };

  const handleToggleStatus = async (
    professorId: number,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "ATIVO" ? "INATIVO" : "ATIVO";

      await updateProfessorStatusMutation.mutateAsync({
        id: professorId,
        status: newStatus,
      });

      await refetch();

      toast({
        title: "Status atualizado",
        description: `Professor ${
          newStatus === "ATIVO" ? "ativado" : "desativado"
        } com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "INATIVO":
        return <Badge variant="destructive">Inativo</Badge>;
      case "PENDENTE":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Professor>[] = [
    {
      accessorKey: "professorProfile.nomeCompleto",
      header: "Nome",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.professorProfile?.nomeCompleto}
        </div>
      ),
    },
    {
      accessorKey: "professorProfile.emailInstitucional",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.professorProfile?.emailInstitucional}
        </div>
      ),
    },
    {
      accessorKey: "professorProfile.departamento.nome",
      header: "Departamento",
      cell: ({ row }) => {
        const dept = departamentos.find(
          (d) => d.id === row.original.professorProfile?.departamentoId
        );
        return dept?.nome || "N/A";
      },
    },
    {
      accessorKey: "professorProfile.regime",
      header: "Regime",
      cell: ({ row }) => (
        <div>
          {row.original.professorProfile?.regime ? (
            <Badge variant="outline">
              {row.original.professorProfile.regime}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "professorProfile.projetos",
      header: "Projetos",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.professorProfile?.projetos || 0}
        </div>
      ),
    },
    {
      accessorKey: "professorProfile.status",
      header: "Status",
      cell: ({ row }) =>
        renderStatusBadge(
          row.original.professorProfile?.projetos ? "ATIVO" : "INATIVO"
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Cadastrado em",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt!), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const professor = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProfessor(professor)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant={
                professor.professorProfile?.projetos ? "destructive" : "default"
              }
              size="sm"
              onClick={() =>
                handleToggleStatus(
                  professor.id,
                  professor.professorProfile?.projetos ? "ATIVO" : "INATIVO"
                )
              }
            >
              {professor.professorProfile?.projetos ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PagesLayout
      title="Gerenciamento de Professores"
      subtitle="Gerencie professores e envie convites"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Professores
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Ativos
                  </p>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      professores.filter((p) => p.professorProfile?.projetos)
                        .length
                    }
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Inativos
                  </p>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      professores.filter((p) => !p.professorProfile?.projetos)
                        .length
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Professores</h2>

          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Convidar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Convidar Novo Professor</DialogTitle>
                <DialogDescription>
                  Envie um convite para um professor se juntar à plataforma
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Institucional *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, email: e.target.value })
                      }
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
                      onValueChange={(value) =>
                        setInviteForm({ ...inviteForm, departamentoId: value })
                      }
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
                      onValueChange={(value: "20H" | "40H" | "DE") =>
                        setInviteForm({ ...inviteForm, regime: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20H">20 horas</SelectItem>
                        <SelectItem value="40H">40 horas</SelectItem>
                        <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="mensagem">
                    Mensagem Personalizada (Opcional)
                  </Label>
                  <Textarea
                    id="mensagem"
                    value={inviteForm.mensagem}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, mensagem: e.target.value })
                    }
                    placeholder="Adicione uma mensagem personalizada ao convite..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
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
              searchableColumn="professorProfile.nomeCompleto"
              searchPlaceholder="Buscar por nome do professor..."
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      Nome Completo
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.nomeCompleto}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email Institucional
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.emailInstitucional}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Matrícula SIAPE
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.matriculaSiape || "-"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.telefone || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Departamento
                    </Label>
                    <p className="text-sm">
                      {departamentos.find(
                        (d) =>
                          d.id ===
                          selectedProfessor.professorProfile?.departamentoId
                      )?.nome || "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Regime de Trabalho
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.regime || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div>
                      {renderStatusBadge(
                        selectedProfessor.professorProfile?.projetos
                          ? "ATIVO"
                          : "INATIVO"
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Projetos Ativos
                    </Label>
                    <p className="text-sm">
                      {selectedProfessor.professorProfile.projetos || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Cadastrado em
                  </Label>
                  <p className="text-sm">
                    {format(
                      new Date(selectedProfessor.createdAt!),
                      "dd/MM/yyyy 'às' HH:mm"
                    )}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  );
}
