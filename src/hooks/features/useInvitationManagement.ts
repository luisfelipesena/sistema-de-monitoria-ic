import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/utils/api'
import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import { inviteFormSchema, type InviteFormData } from '@/types'
import { useToast } from '@/hooks/use-toast'

type InvitationFilterStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'ALL'

export function useInvitationManagement() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<InvitationFilterStatus>('ALL')

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      expiresInDays: 7,
    },
  })

  const {
    data: invitations,
    isLoading,
    refetch,
  } = api.inviteProfessor.getInvitations.useQuery(filterStatus === 'ALL' ? undefined : { status: filterStatus })

  const { data: stats } = api.inviteProfessor.getInvitationStats.useQuery()

  const sendInvitationMutation = useTRPCMutation(api.inviteProfessor.sendInvitation.useMutation, {
    successMessage: 'Convite enviado com sucesso!',
    onSuccess: () => {
      setIsDialogOpen(false)
      refetch()
      form.reset()
    },
  })

  const resendInvitationMutation = api.inviteProfessor.resendInvitation.useMutation({
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Convite reenviado com sucesso!' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    },
  })

  const cancelInvitationMutation = api.inviteProfessor.cancelInvitation.useMutation({
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Convite cancelado!' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    },
  })

  const deleteInvitationMutation = api.inviteProfessor.deleteInvitation.useMutation({
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Convite excluído!' })
      refetch()
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    },
  })

  const handleSendInvite = (data: InviteFormData) => {
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

  const handleFilterChange = (value: InvitationFilterStatus) => {
    setFilterStatus(value)
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/accept-invitation?token=${token}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Sucesso!',
      description: 'Link copiado para a área de transferência!',
    })
  }

  return {
    // State
    isDialogOpen,
    setIsDialogOpen,
    filterStatus,

    // Form
    form,

    // Queries
    invitations,
    isLoading,
    stats,

    // Mutations
    sendInvitationMutation,
    resendInvitationMutation,
    cancelInvitationMutation,
    deleteInvitationMutation,

    // Handlers
    handleSendInvite,
    handleResend,
    handleCancel,
    handleDelete,
    handleFilterChange,
    copyInviteLink,
  }
}
