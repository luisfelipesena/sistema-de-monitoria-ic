import { db } from '@/server/db'
import { notificacaoHistoricoTable } from '@/server/db/schema'
import { STATUS_ENVIO_ENVIADO, STATUS_ENVIO_FALHOU } from '@/types'
import { logger } from '@/utils/logger'
import { emailFromAddress, transporter } from './email-transport'

const log = logger.child({ context: 'EmailSender' })

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

export interface SendBatchResult {
  sent: number
  failed: Array<{ to: string; error: string }>
}

export const emailSender = {
  async send(params: SendEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]

    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: emailFromAddress,
          to: recipient,
          subject: params.subject,
          html: params.html,
          attachments: params.attachments,
        })

        await db.insert(notificacaoHistoricoTable).values({
          destinatarioEmail: recipient,
          assunto: params.subject,
          tipoNotificacao: params.tipoNotificacao,
          statusEnvio: STATUS_ENVIO_ENVIADO,
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
            statusEnvio: STATUS_ENVIO_FALHOU,
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

  async sendBatch(emails: SendEmailParams[]): Promise<SendBatchResult> {
    const results = await Promise.allSettled(emails.map((email) => this.send(email)))

    // send() aborts on the first failing recipient, so a rejected entry counts as
    // failed for all of its addresses.
    return results.reduce<SendBatchResult>(
      (tally, result, index) => {
        const { to } = emails[index]
        const recipients = Array.isArray(to) ? to : [to]

        if (result.status === 'fulfilled') {
          tally.sent += recipients.length
          return tally
        }

        const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error sending email'
        for (const recipient of recipients) {
          tally.failed.push({ to: recipient, error: errorMessage })
        }
        return tally
      },
      { sent: 0, failed: [] }
    )
  },
}
