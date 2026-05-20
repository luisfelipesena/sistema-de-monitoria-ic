import type { db } from '@/server/db'
import { reminderExecutionLogTable } from '@/server/db/schema'
import type { NotificationType } from '@/types'
import { logger } from '@/utils/logger'
import { and, desc, eq, gte } from 'drizzle-orm'
import { createReminderService } from './reminder-service'

type Database = typeof db

const log = logger.child({ context: 'ProactiveReminderService' })

// Configuration for each reminder type
const REMINDER_CONFIG: Record<
  string,
  {
    minHoursBetweenExecutions: number
    defaultDays: number
    description: string
    sendMethod: keyof ReturnType<typeof createReminderService>
  }
> = {
  assinatura_projeto_pendente: {
    minHoursBetweenExecutions: 24, // Once per day
    defaultDays: 7,
    description: 'Projetos aguardando assinatura do admin',
    sendMethod: 'sendProjectSignatureReminders',
  },
  assinatura_termo_pendente: {
    minHoursBetweenExecutions: 24,
    defaultDays: 7,
    description: 'Termos de compromisso pendentes',
    sendMethod: 'sendTermSignatureReminders',
  },
  aceite_vaga_pendente: {
    minHoursBetweenExecutions: 12, // Twice per day (more urgent)
    defaultDays: 3,
    description: 'Alunos com aceite pendente',
    sendMethod: 'sendAcceptanceReminders',
  },
  periodo_inscricao_proximo_fim: {
    minHoursBetweenExecutions: 24,
    defaultDays: 3,
    description: 'Período de inscrições terminando',
    sendMethod: 'sendInscriptionDeadlineReminders',
  },
  relatorio_final_pendente: {
    minHoursBetweenExecutions: 48, // Every 2 days
    defaultDays: 14,
    description: 'Relatórios finais pendentes',
    sendMethod: 'sendFinalReportReminders',
  },
  relatorio_monitor_pendente: {
    minHoursBetweenExecutions: 48,
    defaultDays: 14,
    description: 'Relatórios de monitores pendentes',
    sendMethod: 'sendMonitorReportReminders',
  },
}

export type ProactiveReminderResult = {
  type: NotificationType
  description: string
  sent: boolean
  count: number
  reason: string
}

export function createProactiveReminderService(database: Database) {
  const reminderService = createReminderService(database)

  return {
    /**
     * Check if a specific reminder type should be executed
     */
    async shouldExecuteReminder(reminderType: string): Promise<{ should: boolean; reason: string }> {
      const config = REMINDER_CONFIG[reminderType]
      if (!config) {
        return { should: false, reason: 'Tipo de lembrete não configurado para execução proativa' }
      }

      const minDate = new Date()
      minDate.setHours(minDate.getHours() - config.minHoursBetweenExecutions)

      // Check last execution
      const lastExecution = await database.query.reminderExecutionLogTable.findFirst({
        where: and(
          eq(reminderExecutionLogTable.reminderType, reminderType),
          gte(reminderExecutionLogTable.executedAt, minDate)
        ),
        orderBy: desc(reminderExecutionLogTable.executedAt),
      })

      if (lastExecution) {
        const hoursAgo = Math.round((Date.now() - lastExecution.executedAt.getTime()) / (1000 * 60 * 60))
        return {
          should: false,
          reason: `Executado há ${hoursAgo}h (mínimo: ${config.minHoursBetweenExecutions}h)`,
        }
      }

      return { should: true, reason: 'Pronto para execução' }
    },

    /**
     * Execute a specific reminder type if it should be executed
     */
    async executeReminderIfNeeded(reminderType: string, userId: number): Promise<ProactiveReminderResult> {
      const config = REMINDER_CONFIG[reminderType]
      if (!config) {
        return {
          type: reminderType as NotificationType,
          description: 'Desconhecido',
          sent: false,
          count: 0,
          reason: 'Tipo de lembrete não configurado',
        }
      }

      const { should, reason } = await this.shouldExecuteReminder(reminderType)

      if (!should) {
        return {
          type: reminderType as NotificationType,
          description: config.description,
          sent: false,
          count: 0,
          reason,
        }
      }

      try {
        // Execute the reminder
        const sendMethod = reminderService[config.sendMethod] as (dias: number, userId: number) => Promise<number>
        const count = await sendMethod(config.defaultDays, userId)

        // Log the execution
        await database.insert(reminderExecutionLogTable).values({
          reminderType,
          executedByUserId: userId,
          isProactive: true,
          notificationsSent: count,
          details: JSON.stringify({ dias: config.defaultDays }),
        })

        log.info({ reminderType, count }, 'Lembrete proativo executado')

        return {
          type: reminderType as NotificationType,
          description: config.description,
          sent: true,
          count,
          reason: count > 0 ? `${count} notificações enviadas` : 'Nenhuma notificação necessária',
        }
      } catch (error) {
        log.error({ reminderType, error }, 'Erro ao executar lembrete proativo')
        return {
          type: reminderType as NotificationType,
          description: config.description,
          sent: false,
          count: 0,
          reason: 'Erro ao executar',
        }
      }
    },

    /**
     * Execute all pending proactive reminders
     * This is the main method called when admin accesses the dashboard
     */
    async executeAllPendingReminders(userId: number): Promise<{
      executed: ProactiveReminderResult[]
      totalSent: number
    }> {
      const results: ProactiveReminderResult[] = []
      let totalSent = 0

      for (const reminderType of Object.keys(REMINDER_CONFIG)) {
        const result = await this.executeReminderIfNeeded(reminderType, userId)
        results.push(result)
        if (result.sent) {
          totalSent += result.count
        }
      }

      return { executed: results, totalSent }
    },

    /**
     * Get status of all reminder types (whether they need execution)
     */
    async getReminderStatus(): Promise<
      Array<{
        type: string
        description: string
        shouldExecute: boolean
        reason: string
        lastExecutedAt: Date | null
        config: { minHours: number; defaultDays: number }
      }>
    > {
      const status = []

      for (const [reminderType, config] of Object.entries(REMINDER_CONFIG)) {
        const { should, reason } = await this.shouldExecuteReminder(reminderType)

        const lastExecution = await database.query.reminderExecutionLogTable.findFirst({
          where: eq(reminderExecutionLogTable.reminderType, reminderType),
          orderBy: desc(reminderExecutionLogTable.executedAt),
        })

        status.push({
          type: reminderType,
          description: config.description,
          shouldExecute: should,
          reason,
          lastExecutedAt: lastExecution?.executedAt ?? null,
          config: {
            minHours: config.minHoursBetweenExecutions,
            defaultDays: config.defaultDays,
          },
        })
      }

      return status
    },

    /**
     * Log a manual reminder execution
     */
    async logManualExecution(reminderType: string, userId: number, count: number): Promise<void> {
      await database.insert(reminderExecutionLogTable).values({
        reminderType,
        executedByUserId: userId,
        isProactive: false,
        notificationsSent: count,
        details: JSON.stringify({ manual: true }),
      })
    },

    /**
     * Get execution history
     */
    async getExecutionHistory(limit = 50) {
      return database.query.reminderExecutionLogTable.findMany({
        with: {
          executedBy: {
            columns: { id: true, username: true, email: true },
          },
        },
        orderBy: desc(reminderExecutionLogTable.executedAt),
        limit,
      })
    },
  }
}

export type ProactiveReminderService = ReturnType<typeof createProactiveReminderService>
