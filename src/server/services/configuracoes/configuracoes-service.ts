import { db } from '@/server/db'
import { createConfiguracoesRepository } from './configuracoes-repository'

export interface UpdateEmailsInput {
  departamentoId: number
  emailInstituto?: string | null
  emailChefeDepartamento?: string | null
}

export const createConfiguracoesService = (database: typeof db) => {
  const configuracoesRepository = createConfiguracoesRepository(database)

  return {
    async getDepartamentos() {
      return await configuracoesRepository.getDepartamentos()
    },

    async updateEmails(input: UpdateEmailsInput) {
      await configuracoesRepository.updateEmails(input.departamentoId, {
        emailInstituto: input.emailInstituto,
        emailChefeDepartamento: input.emailChefeDepartamento,
      })

      return { success: true }
    },
  }
}

export const configuracoesService = createConfiguracoesService(db)
