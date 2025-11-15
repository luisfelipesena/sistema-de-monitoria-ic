import { env } from '@/utils/env'
import nodemailer from 'nodemailer'
import { db } from '@/server/db'
import { notificacaoHistoricoTable, statusEnvioEnum } from '@/server/db/schema'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'EmailSender' })

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  tipoNotificacao: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
  remetenteUserId?: number
  projetoId?: number
  alunoId?: number
}

export const emailSender = {
  async send(params: SendEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `"Sistema de Monitoria IC - UFBA" <${env.EMAIL_USER}>`,
          to: recipient,
          subject: params.subject,
          html: params.html,
          attachments: params.attachments,
        })

        await db.insert(notificacaoHistoricoTable).values({
          destinatarioEmail: recipient,
          assunto: params.subject,
          tipoNotificacao: params.tipoNotificacao,
          statusEnvio: statusEnvioEnum.enumValues[0], // ENVIADO
          remetenteUserId: params.remetenteUserId,
          projetoId: params.projetoId,
          alunoId: params.alunoId,
        })

        log.info({ to: recipient, subject: params.subject, tipo: params.tipoNotificacao }, 'Email sent successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email'
        log.error({ to: recipient, subject: params.subject, error: errorMessage }, 'Failed to send email')

        try {
          await db.insert(notificacaoHistoricoTable).values({
            destinatarioEmail: recipient,
            assunto: params.subject,
            tipoNotificacao: params.tipoNotificacao,
            statusEnvio: statusEnvioEnum.enumValues[1], // FALHOU
            mensagemErro: errorMessage,
            remetenteUserId: params.remetenteUserId,
            projetoId: params.projetoId,
            alunoId: params.alunoId,
          })
        } catch (dbError) {
          log.error({ dbError, to: recipient }, 'CRITICAL: Failed to log email failure to database')
        }

        throw error
      }
    }
  },

  async sendBatch(emails: SendEmailParams[]): Promise<void> {
    await Promise.allSettled(emails.map((email) => this.send(email)))
  },
}
