import { emailSender } from './email-sender'

export const authEmailService = {
  async sendEmailVerification(data: { to: string; verificationLink: string }): Promise<void> {
    const html = `
      <p>Olá,</p>
      <p>Recebemos uma solicitação de criação de conta no Sistema de Monitoria IC.</p>
      <p>Para confirmar seu e-mail e concluir o cadastro, clique no link abaixo:</p>
      <p><a href="${data.verificationLink}">Confirmar e-mail</a></p>
      <p>Se você não solicitou esta conta, pode ignorar este e-mail.</p>
      <p>Atenciosamente,<br/>Equipe Sistema de Monitoria IC</p>
    `

    await emailSender.send({
      to: data.to,
      subject: '[Monitoria IC] Confirme seu e-mail',
      html,
      tipoNotificacao: 'EMAIL_VERIFICATION',
    })
  },

  async sendPasswordReset(data: { to: string; resetLink: string }): Promise<void> {
    const html = `
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha no Sistema de Monitoria IC.</p>
      <p>Se você fez essa solicitação, clique no link abaixo para criar uma nova senha:</p>
      <p><a href="${data.resetLink}">Redefinir senha</a></p>
      <p>Este link expira em 1 hora. Caso não tenha solicitado a redefinição, ignore este e-mail.</p>
      <p>Atenciosamente,<br/>Equipe Sistema de Monitoria IC</p>
    `

    await emailSender.send({
      to: data.to,
      subject: '[Monitoria IC] Redefinição de senha',
      html,
      tipoNotificacao: 'PASSWORD_RESET',
    })
  },
}
