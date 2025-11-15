import type { db } from '@/server/db'
import { departamentoTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

type Database = typeof db

export interface UpdateEmailsData {
  emailInstituto?: string | null
  emailChefeDepartamento?: string | null
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

    async updateEmails(departamentoId: number, data: UpdateEmailsData) {
      await database
        .update(departamentoTable)
        .set({
          emailInstituto: data.emailInstituto || null,
          emailChefeDepartamento: data.emailChefeDepartamento || null,
        })
        .where(eq(departamentoTable.id, departamentoId))
    },
  }
}
