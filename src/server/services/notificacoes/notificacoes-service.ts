import type { db } from '@/server/db'
import { emailService } from '@/server/lib/email'
import { BusinessError, ForbiddenError } from '@/server/lib/errors'
import type { NotificationPriority, NotificationType, StatsPeriod, UserRole } from '@/types'
import { ADMIN } from '@/types'
import { createNotificacoesRepository } from './notificacoes-repository'
import { createReminderService } from './reminder-service'

type Database = typeof db

interface SendRemindersInput {
  tipo: NotificationType
  filtros?: {
    dias?: number
    departamentoId?: string
  }
}

interface CreateNotificationInput {
  tipo: NotificationPriority
  titulo: string
  conteudo: string
  destinatarioIds: string[]
  enviarEmail: boolean
}

export function createNotificacoesService(db: Database) {
  const repo = createNotificacoesRepository(db)
  const reminderService = createReminderService(db)

  return {
    async sendReminders(input: SendRemindersInput, userId: number, userRole: UserRole) {
      if (userRole !== ADMIN) {
        throw new ForbiddenError('Apenas administradores podem enviar lembretes automáticos')
      }

      const diasLimite = input.filtros?.dias || 7
      let notificacoesEnviadas = 0

      switch (input.tipo) {
        case 'assinatura_projeto_pendente':
          notificacoesEnviadas = await reminderService.sendProjectSignatureReminders(diasLimite, userId)
          break

        case 'assinatura_termo_pendente':
          notificacoesEnviadas = await reminderService.sendTermSignatureReminders(diasLimite, userId)
          break

        case 'aceite_vaga_pendente':
          notificacoesEnviadas = await reminderService.sendAcceptanceReminders(diasLimite, userId)
          break

        default:
          throw new BusinessError('Tipo de lembrete não implementado', 'INVALID_REMINDER_TYPE')
      }

      await repo.insertHistorico({
        destinatarioEmail: 'sistema@ufba.br',
        assunto: `Lembretes: ${input.tipo}`,
        tipoNotificacao: 'lembrete_automatico',
        statusEnvio: 'ENVIADO',
        remetenteUserId: userId,
      })

      return {
        success: true,
        notificacoesEnviadas,
        tipo: input.tipo,
      }
    },

    async getHistory(limite: number, offset: number, userId: number | undefined, userRole: UserRole) {
      const filterUserId = userRole !== 'admin' && userId ? userId : undefined

      const notificacoes = await repo.findHistoryWithFilters(limite, offset, filterUserId)

      return notificacoes.map((notif) => ({
        id: notif.id,
        tipo: notif.tipoNotificacao,
        titulo: notif.assunto,
        conteudo: notif.statusEnvio === 'ENVIADO' ? 'Enviado com sucesso' : notif.mensagemErro || 'Falha no envio',
        lida: true,
        createdAt: notif.dataEnvio,
        readAt: notif.dataEnvio,
        remetente: notif.remetente,
        destinatario: { email: notif.destinatarioEmail },
        metadata: {
          statusEnvio: notif.statusEnvio,
          projetoId: notif.projetoId,
          alunoId: notif.alunoId,
        },
      }))
    },

    async createNotification(input: CreateNotificationInput, userId: number, userRole: UserRole, username: string) {
      if (userRole !== ADMIN) {
        throw new ForbiddenError('Apenas administradores podem criar notificações')
      }

      const destinatarios = await repo.findUsersByIds(input.destinatarioIds.map((id) => parseInt(id)))

      if (destinatarios.length !== input.destinatarioIds.length) {
        throw new BusinessError('Alguns destinatários não foram encontrados', 'RECIPIENTS_NOT_FOUND')
      }

      let emailsEnviados = 0

      if (input.enviarEmail) {
        const emailPromises = destinatarios.map(async (destinatario) => {
          await emailService.sendGenericEmail({
            to: destinatario.email,
            subject: `[Sistema de Monitoria] ${input.titulo}`,
            html: `
<!DOCTYPE html>
<html lang="pt-br">
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color: #1d4ed8;">${input.titulo}</h2>
    <p>${input.conteudo}</p>
    <p style="margin-top: 24px;">Esta é uma notificação do Sistema de Monitoria IC.</p>
    <p>Atenciosamente,<br />${username}</p>
  </body>
</html>`,
            tipoNotificacao: 'NOTIFICACAO_PERSONALIZADA',
            remetenteUserId: userId,
          })

          await repo.insertHistorico({
            destinatarioEmail: destinatario.email,
            assunto: input.titulo,
            tipoNotificacao: input.tipo,
            statusEnvio: 'ENVIADO',
            remetenteUserId: userId,
          })
        })

        await Promise.all(emailPromises)
        emailsEnviados = destinatarios.length
      }

      return {
        success: true,
        notificacoesCriadas: destinatarios.length,
        emailsEnviados,
      }
    },

    async getStats(periodo: StatsPeriod, userRole: UserRole) {
      if (userRole !== ADMIN) {
        throw new ForbiddenError('Apenas administradores podem ver estatísticas')
      }

      const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const stats = await repo.getStats(dataInicio)

      return {
        periodo,
        total: Number(stats?.total) || 0,
        enviadas: Number(stats?.enviadas) || 0,
        falharam: Number(stats?.falharam) || 0,
        lembretes: Number(stats?.lembretes) || 0,
        urgentes: Number(stats?.urgentes) || 0,
        taxaEntrega: stats?.total ? Math.round((Number(stats.enviadas) / Number(stats.total)) * 100) : 0,
      }
    },
  }
}

export type NotificacoesService = ReturnType<typeof createNotificacoesService>
