'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { TableComponent } from '@/components/layout/TableComponent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { InvitationStatsCards } from '@/components/features/admin/invite-professor/InvitationStatsCards'
import { InvitationTableHeader } from '@/components/features/admin/invite-professor/InvitationTableHeader'
import { InviteFormDialog } from '@/components/features/admin/invite-professor/InviteFormDialog'
import { EmptyInvitationState } from '@/components/features/admin/invite-professor/EmptyInvitationState'
import { createInvitationColumns } from '@/components/features/admin/invite-professor/InvitationTableColumns'
import { useInvitationManagement } from '@/hooks/features/useInvitationManagement'
import { useMemo } from 'react'

export default function InviteProfessorPage() {
  const {
    isDialogOpen,
    setIsDialogOpen,
    filterStatus,
    form,
    invitations,
    isLoading,
    stats,
    sendInvitationMutation,
    resendInvitationMutation,
    cancelInvitationMutation,
    deleteInvitationMutation,
    handleSendInvite,
    handleResend,
    handleCancel,
    handleDelete,
    handleFilterChange,
    copyInviteLink,
  } = useInvitationManagement()

  const columns = useMemo(
    () =>
      createInvitationColumns({
        onCopyLink: copyInviteLink,
        onResend: handleResend,
        onCancel: handleCancel,
        onDelete: handleDelete,
        isResending: resendInvitationMutation.isPending,
        isCanceling: cancelInvitationMutation.isPending,
        isDeleting: deleteInvitationMutation.isPending,
      }),
    [
      copyInviteLink,
      handleResend,
      handleCancel,
      handleDelete,
      resendInvitationMutation.isPending,
      cancelInvitationMutation.isPending,
      deleteInvitationMutation.isPending,
    ]
  )

  return (
    <PagesLayout title="Convidar Professor" subtitle="Gerencie convites para professores ingressarem no sistema">
      <div className="space-y-6">
        {stats && <InvitationStatsCards stats={stats} />}

        <Card>
          <CardHeader>
            <CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <InvitationTableHeader
                  filterStatus={filterStatus}
                  onFilterChange={handleFilterChange}
                  invitationCount={invitations?.length}
                />
                <InviteFormDialog
                  isOpen={isDialogOpen}
                  onClose={() => setIsDialogOpen(false)}
                  onSubmit={handleSendInvite}
                  form={form}
                  isSubmitting={sendInvitationMutation.isPending}
                />
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  <p className="mt-2">Carregando convites...</p>
                </div>
              </div>
            ) : invitations && invitations.length > 0 ? (
              <TableComponent columns={columns} data={invitations} searchableColumn="email" searchPlaceholder="Buscar por email..." />
            ) : (
              <EmptyInvitationState filterStatus={filterStatus} />
            )}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
}
