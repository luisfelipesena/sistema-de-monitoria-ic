"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VoluntarioListItem } from "@/types"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Mail, Phone, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function VolunteerManagementPage() {
  const { toast } = useToast()

  const { data: voluntarios, isLoading, refetch } = api.projeto.getVolunteers.useQuery()
  const updateVolunteerMutation = api.projeto.updateVolunteerStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Status do voluntário atualizado!",
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const handleUpdateStatus = (voluntarioId: number, status: "ATIVO" | "INATIVO") => {
    updateVolunteerMutation.mutate({ id: voluntarioId, status })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return (
          <Badge variant="default" className="bg-green-500">
            Ativo
          </Badge>
        )
      case "INATIVO":
        return <Badge variant="secondary">Inativo</Badge>
      case "PENDENTE":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            Pendente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: ColumnDef<VoluntarioListItem>[] = [
    {
      header: "Voluntário",
      accessorKey: "nomeCompleto",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nomeCompleto}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
          {row.original.telefone && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.telefone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Disciplina",
      accessorKey: "disciplina.codigo",
      cell: ({ row }) => (
        <div>
          <div className="font-mono font-medium">{row.original.disciplina.codigo}</div>
          <div className="text-sm text-muted-foreground">{row.original.disciplina.nome}</div>
        </div>
      ),
    },
    {
      header: "Projeto",
      accessorKey: "projeto.titulo",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.projeto.titulo}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: "Data de Início",
      accessorKey: "dataInicio",
      cell: ({ row }) =>
        row.original.dataInicio ? new Date(row.original.dataInicio).toLocaleDateString("pt-BR") : "-",
    },
    {
      header: "Ações",
      id: "actions",
      cell: ({ row }) => {
        const voluntario = row.original
        return (
          <div className="flex items-center gap-2">
            {voluntario.status === "PENDENTE" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateStatus(voluntario.id, "ATIVO")}
                  disabled={updateVolunteerMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Ativar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateStatus(voluntario.id, "INATIVO")}
                  disabled={updateVolunteerMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </>
            )}
            {voluntario.status === "ATIVO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(voluntario.id, "INATIVO")}
                disabled={updateVolunteerMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Desativar
              </Button>
            )}
            {voluntario.status === "INATIVO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(voluntario.id, "ATIVO")}
                disabled={updateVolunteerMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Reativar
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout title="Gerenciar Voluntários" subtitle="Gerencie os voluntários dos seus projetos de monitoria">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voluntários
            {voluntarios && (
              <Badge variant="outline" className="ml-2">
                {voluntarios.length} voluntário(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Carregando voluntários...</p>
              </div>
            </div>
          ) : voluntarios && voluntarios.length > 0 ? (
            <TableComponent
              columns={columns}
              data={voluntarios}
              searchableColumn="nomeCompleto"
              searchPlaceholder="Buscar por nome do voluntário..."
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum voluntário encontrado</h3>
              <p>Ainda não há voluntários inscritos nos seus projetos de monitoria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
