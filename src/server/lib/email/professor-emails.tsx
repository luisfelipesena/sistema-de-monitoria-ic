import { Invitation } from '@/server/emails/templates/professor'
import { renderEmail } from '@/server/emails/render'
import { emailSender } from './email-sender'

export const professorEmailService = {
  async sendInvitation(data: {
    professorEmail: string
    invitationLink: string
    adminName?: string
    remetenteUserId?: number
  }): Promise<void> {
    const clientName = 'Sistema de Monitoria IC'
    const subject = `[${clientName}] Convite para se juntar à plataforma como Professor`

    const html = await renderEmail(
      <Invitation
        professorEmail={data.professorEmail}
        invitationLink={data.invitationLink}
        adminName={data.adminName}
      />
    )

    await emailSender.send({
      to: data.professorEmail,
      subject,
      html,
      tipoNotificacao: 'CONVITE_PROFESSOR',
      remetenteUserId: data.remetenteUserId,
    })
  },
}
