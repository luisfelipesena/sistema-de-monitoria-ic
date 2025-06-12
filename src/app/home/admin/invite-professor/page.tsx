'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/utils/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColumnDef } from '@tanstack/react-table'
import { UserPlus, Mail, RefreshCw, Trash2, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const inviteFormSchema = z.object({
  email: z.string().email('Email inválido'),
  expiresInDays: z.number().int().min(1).max(30),
})

type InviteFormData = z.infer<typeof inviteFormSchema>

type InvitationItem = {
  id: number
  email: string
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  expiresAt: Date
  createdAt: Date
  invitedByUser: {
    username: string
    email: string
  }
  acceptedByUser?: {
    username: string
    email: string
  } | null
}

export default function InviteProfessorPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'ALL'>('ALL')

  const { data: invitations, isLoading, refetch } = api.inviteProfessor.getInvitations.useQuery(
    filterStatus === 'ALL' ? undefined : { status: filterStatus }
  )
  const { data: stats } = api.inviteProfessor.getInvitationStats.useQuery()

  const sendInvitationMutation = api.inviteProfessor.sendInvitation.useMutation({
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!')
      setIsDialogOpen(false)
      refetch()
      form.reset()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const resendInvitationMutation = api.inviteProfessor.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success('Convite reenviado com sucesso!')
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const cancelInvitationMutation = api.inviteProfessor.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success('Convite cancelado!')
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const deleteInvitationMutation = api.inviteProfessor.deleteInvitation.useMutation({
    onSuccess: () => {
      toast.success('Convite excluído!')
      refetch()
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      expiresInDays: 7,
    },
  })

  const handleInvite = (data: InviteFormData) => {
    sendInvitationMutation.mutate(data)
  }

  const handleResend = (invitationId: number) => {
    resendInvitationMutation.mutate({ invitationId, expiresInDays: 7 })
  }

  const handleCancel = (invitationId: number) => {
    cancelInvitationMutation.mutate({ invitationId })
  }

  const handleDelete = (invitationId: number) => {
    deleteInvitationMutation.mutate({ invitationId })
  }

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const now = new Date()
    const isExpired = status === 'PENDING' && expiresAt < now

    if (isExpired || status === 'EXPIRED') {
      return (
        <Badge variant="outline" className="border-red-500 text-red-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      )
    }

    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'ACCEPTED':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceito
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/auth/accept-invitation?token=${token}`
  }

  const copyInviteLink = (token: string) => {
    const link = getInviteLink(token)
    navigator.clipboard.writeText(link)
    toast.success('Link copiado para a área de transferência!')
  }

  const columns: ColumnDef<InvitationItem>[] = [
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.email}</div>
          <div className="text-sm text-muted-foreground">
            Convite enviado em {new Date(row.original.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status, row.original.expiresAt),
    },
    {
      header: 'Expira em',
      accessorKey: 'expiresAt',
      cell: ({ row }) => {
        const now = new Date()
        const expiresAt = new Date(row.original.expiresAt)
        const isExpired = expiresAt < now
        
        if (isExpired) {
          return <span className="text-red-600">Expirado</span>
        }
        
        const diffTime = expiresAt.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return (
          <span className={diffDays <= 1 ? 'text-orange-600' : 'text-muted-foreground'}>
            {diffDays} dia(s)
          </span>
        )
      },
    },
    {
      header: 'Convidado por',
      accessorKey: 'invitedByUser.username',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.invitedByUser.username}</div>
          <div className="text-sm text-muted-foreground">{row.original.invitedByUser.email}</div>
        </div>
      ),
    },
    {
      header: 'Aceito por',
      cell: ({ row }) => {
        if (row.original.acceptedByUser) {
          return (
            <div>
              <div className="font-medium">{row.original.acceptedByUser.username}</div>
              <div className="text-sm text-muted-foreground">{row.original.acceptedByUser.email}</div>
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      header: 'Ações',
      id: 'actions',
      cell: ({ row }) => {
        const invitation = row.original
        const now = new Date()
        const isExpired = invitation.expiresAt < now || invitation.status === 'EXPIRED'
        const isPending = invitation.status === 'PENDING' && !isExpired

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyInviteLink(invitation.token)}
                >
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResend(invitation.id)}
                  disabled={resendInvitationMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(invitation.id)}
                  disabled={cancelInvitationMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {(isExpired || invitation.status === 'EXPIRED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResend(invitation.id)}
                disabled={resendInvitationMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reenviar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(invitation.id)}
              disabled={deleteInvitationMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <PagesLayout 
      title="Convidar Professor" 
      subtitle="Gerencie convites para professores ingressarem no sistema"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Convites</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-semibold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aceitos</p>
                    <p className="text-2xl font-semibold">{stats.accepted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expirados</p>
                    <p className="text-2xl font-semibold">{stats.expired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Convites de Professor
                {invitations && (
                  <Badge variant="outline" className="ml-2">
                    {invitations.length} convite(s)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendentes</SelectItem>
                    <SelectItem value="ACCEPTED">Aceitos</SelectItem>
                    <SelectItem value="EXPIRED">Expirados</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Convite
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Convidar Professor</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email do Professor</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="professor@ufba.br"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expiresInDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expira em (dias)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  max="30"
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={sendInvitationMutation.isPending}
                        >
                          {sendInvitationMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2">Carregando convites...</p>
                </div>
              </div>
            ) : invitations && invitations.length > 0 ? (
              <TableComponent
                columns={columns}
                data={invitations}
                searchableColumn="email"
                searchPlaceholder="Buscar por email..."
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum convite encontrado
                </h3>
                <p>
                  {filterStatus === 'ALL' 
                    ? 'Ainda não foram enviados convites para professores.'
                    : `Não há convites com status "${filterStatus.toLowerCase()}".`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}