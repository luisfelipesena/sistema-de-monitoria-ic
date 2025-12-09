import type { db } from '@/server/db'
import { configuracaoSistemaTable, departamentoTable } from '@/server/db/schema'
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
  }
}
