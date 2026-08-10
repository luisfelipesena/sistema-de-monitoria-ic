import { db } from '@/server/db'
import { notificacaoHistoricoTable } from '@/server/db/schema'
import { STATUS_ENVIO_ENVIADO, STATUS_ENVIO_FALHOU } from '@/types'
import { logger } from '@/utils/logger'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { emailFromAddress, transporter } from './email-transport'

const log = logger.child({ context: 'EmailSender' })

const EMAILS_DIR = join(process.cwd(), 'data', 'emails')

function saveEmailToFile(to: string, subject: string, html: string) {
  try {
    if (!existsSync(EMAILS_DIR)) {
      mkdirSync(EMAILS_DIR, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeSubject = subject
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .slice(0, 50)
      .trim()
      .replace(/\s+/g, '_')
    const fileName = `${timestamp}_${safeSubject}_${to.replace('@', '_at_')}.html`
    const filePath = join(EMAILS_DIR, fileName)

    const fullHtml = `<!-- To: ${to} -->\n<!-- Subject: ${subject} -->\n<!-- Date: ${new Date().toISOString()} -->\n${html}`
    writeFileSync(filePath, fullHtml, 'utf-8')
    log.info({ filePath, to, subject }, 'DEV: Email salvo em arquivo local')
  } catch (err) {
    log.warn({ err, to, subject }, 'DEV: Falha ao salvar email em arquivo')
  }
}

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

        if (process.env.NODE_ENV !== 'production') {
          log.warn(
            { to: recipient, subject: params.subject, error: errorMessage },
            'DEV MODE: SMTP indisponível/inválido. Salvando e-mail localmente em data/emails/'
          )

          // Save email HTML to local file for inspection
          saveEmailToFile(recipient, params.subject, params.html)

          try {
            await db.insert(notificacaoHistoricoTable).values({
              destinatarioEmail: recipient,
              assunto: params.subject,
              tipoNotificacao: params.tipoNotificacao,
              statusEnvio: STATUS_ENVIO_ENVIADO,
              remetenteUserId: params.remetenteUserId,
              projetoId: params.projetoId,
              alunoId: params.alunoId,
            })
          } catch (dbError) {
            log.error({ dbError, to: recipient }, 'Failed to log simulated email to database')
          }

          return
        }

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
