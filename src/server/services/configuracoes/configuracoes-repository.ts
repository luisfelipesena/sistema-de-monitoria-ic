import type { db } from '@/server/db'
import { configuracaoSistemaTable, departamentoTable, emailNotificacaoTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

type Database = typeof db

export interface UpdateDepartamentoEmailData {
  email?: string | null
}

export const createConfiguracoesRepository = (database: Database) => {
  return {
    async getDepartamentos() {
      return database.query.departamentoTable.findMany({
        columns: {
          id: true,
          nome: true,
          sigla: true,
          emailInstituto: true,
          emailChefeDepartamento: true,
        },
        orderBy: (departamento, { asc }) => [asc(departamento.nome)],
      })
    },

    async updateDepartamentoEmail(departamentoId: number, email: string | null) {
      await database
        .update(departamentoTable)
        .set({ emailInstituto: email })
        .where(eq(departamentoTable.id, departamentoId))
    },

    async createDepartamento(data: {
      nome: string
      sigla?: string | null
      emailInstituto?: string | null
      unidadeUniversitaria: string
    }) {
      const [created] = await database.insert(departamentoTable).values(data).returning({ id: departamentoTable.id })
      return created
    },

    async updateDepartamento(
      departamentoId: number,
      data: { nome?: string; sigla?: string | null; emailInstituto?: string | null }
    ) {
      await database.update(departamentoTable).set(data).where(eq(departamentoTable.id, departamentoId))
    },

    async deleteDepartamento(departamentoId: number) {
      await database.delete(departamentoTable).where(eq(departamentoTable.id, departamentoId))
    },

    async getConfiguracaoSistema(chave: string) {
      return database.query.configuracaoSistemaTable.findFirst({
        where: eq(configuracaoSistemaTable.chave, chave),
      })
    },

    async setConfiguracaoSistema(chave: string, valor: string | null) {
      await database
        .update(configuracaoSistemaTable)
        .set({ valor, updatedAt: new Date() })
        .where(eq(configuracaoSistemaTable.chave, chave))
    },

    async upsertConfiguracaoSistema(chave: string, valor: string | null, descricao?: string) {
      const existing = await database.query.configuracaoSistemaTable.findFirst({
        where: eq(configuracaoSistemaTable.chave, chave),
      })
      if (existing) {
        await database
          .update(configuracaoSistemaTable)
          .set({ valor, updatedAt: new Date() })
          .where(eq(configuracaoSistemaTable.chave, chave))
      } else {
        await database.insert(configuracaoSistemaTable).values({
          chave,
          valor,
          descricao: descricao ?? null,
        })
      }
    },

    // --- Email Notificação ---

    async getEmailsNotificacao() {
      return database.query.emailNotificacaoTable.findMany({
        orderBy: (email, { asc }) => [asc(email.nome)],
      })
    },

    async findEmailNotificacaoByEmail(email: string, excludeId?: number) {
      const result = await database.query.emailNotificacaoTable.findFirst({
        where: eq(emailNotificacaoTable.email, email),
      })
      if (result && excludeId && result.id === excludeId) return null
      return result
    },

    async createEmailNotificacao(data: { nome: string; email: string; descricao?: string | null }) {
      const [created] = await database
        .insert(emailNotificacaoTable)
        .values({
          nome: data.nome,
          email: data.email,
          descricao: data.descricao ?? null,
        })
        .returning()
      return created
    },

    async updateEmailNotificacao(id: number, data: { nome?: string; email?: string; descricao?: string | null }) {
      await database.update(emailNotificacaoTable).set(data).where(eq(emailNotificacaoTable.id, id))
    },

    async deleteEmailNotificacao(id: number) {
      await database.delete(emailNotificacaoTable).where(eq(emailNotificacaoTable.id, id))
    },
  }
}
