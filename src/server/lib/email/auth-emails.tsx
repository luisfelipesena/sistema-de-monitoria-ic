import { EmailVerification, PasswordReset } from '@/server/emails/templates/auth'
import { renderEmail } from '@/server/emails/render'
import { emailSender } from './email-sender'

export const authEmailService = {
  async sendEmailVerification(data: { to: string; verificationLink: string }): Promise<void> {
    const html = await renderEmail(
      <EmailVerification verificationLink={data.verificationLink} />
    )

    await emailSender.send({
      to: data.to,
      subject: '[Monitoria IC] Confirme seu e-mail',
      html,
      tipoNotificacao: 'EMAIL_VERIFICATION',
    })
  },

  async sendPasswordReset(data: { to: string; resetLink: string }): Promise<void> {
    const html = await renderEmail(<PasswordReset resetLink={data.resetLink} />)

    await emailSender.send({
      to: data.to,
      subject: '[Monitoria IC] Redefinição de senha',
      html,
      tipoNotificacao: 'PASSWORD_RESET',
    })
  },
}
