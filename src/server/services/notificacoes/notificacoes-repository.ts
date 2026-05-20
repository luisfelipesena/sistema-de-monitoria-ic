import type { db } from '@/server/db'
import { inscricaoTable, notificacaoHistoricoTable, projetoTable, userTable, vagaTable } from '@/server/db/schema'
import { ADMIN, PROJETO_STATUS_SUBMITTED, STATUS_INSCRICAO_SUBMITTED } from '@/types'
import type { InferInsertModel } from 'drizzle-orm'
import { and, desc, eq, sql } from 'drizzle-orm'

type Database = typeof db

export type NotificacaoHistoricoInsert = InferInsertModel<typeof notificacaoHistoricoTable>

export function createNotificacoesRepository(db: Database) {
  return {
    async findPendingProjectsByDate(dataLimite: Date) {
      return db.query.projetoTable.findMany({
        where: and(eq(projetoTable.status, PROJETO_STATUS_SUBMITTED), sql`${projetoTable.updatedAt} <= ${dataLimite}`),
        with: {
          departamento: true,
          professorResponsavel: {
            with: { user: true },
          },
        },
      })
    },

    async findAllAdmins() {
      return db.query.userTable.findMany({
        where: eq(userTable.role, ADMIN),
      })
    },

    async findPendingTermsByDate(dataLimite: Date) {
      return db.query.vagaTable.findMany({
        where: sql`${vagaTable.updatedAt} <= ${dataLimite}`,
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })
    },

    async findPendingInscriptionsByDate(dataLimite: Date) {
      return db.query.inscricaoTable.findMany({
        where: and(
          eq(inscricaoTable.status, STATUS_INSCRICAO_SUBMITTED),
          sql`${inscricaoTable.notaFinal} >= 7.0`,
          sql`${inscricaoTable.updatedAt} <= ${dataLimite}`
        ),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: true,
        },
      })
    },

    async insertHistorico(data: NotificacaoHistoricoInsert) {
      await db.insert(notificacaoHistoricoTable).values(data)
    },

    async findHistoryWithFilters(limite: number, offset: number, userId?: number) {
      return db.query.notificacaoHistoricoTable.findMany({
        where: userId ? eq(notificacaoHistoricoTable.remetenteUserId, userId) : undefined,
        with: {
          remetente: {
            columns: { id: true, username: true, email: true },
          },
          projeto: true,
          aluno: true,
        },
        orderBy: [desc(notificacaoHistoricoTable.dataEnvio)],
        limit: limite,
        offset: offset,
      })
    },

    async getStats(dataInicio: Date) {
      const [stats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          enviadas: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.statusEnvio} = 'ENVIADO' THEN 1 END)`,
          falharam: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.statusEnvio} = 'FALHOU' THEN 1 END)`,
          lembretes: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.tipoNotificacao} = 'lembrete_automatico' THEN 1 END)`,
          urgentes: sql<number>`COUNT(CASE WHEN ${notificacaoHistoricoTable.tipoNotificacao} = 'urgente' THEN 1 END)`,
        })
        .from(notificacaoHistoricoTable)
        .where(sql`${notificacaoHistoricoTable.dataEnvio} >= ${dataInicio}`)

      return stats
    },

    async findUsersByIds(userIds: number[]) {
      return db.query.userTable.findMany({
        where: sql`${userTable.id} IN (${userIds.join(',')})`,
      })
    },
  }
}

export type NotificacoesRepository = ReturnType<typeof createNotificacoesRepository>
