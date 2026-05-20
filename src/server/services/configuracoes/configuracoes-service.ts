import { db } from '@/server/db'
import { createConfiguracoesRepository } from './configuracoes-repository'

export const EMAIL_IC_CHAVE = 'EMAIL_INSTITUTO_COMPUTACAO'

export interface UpdateDepartamentoEmailInput {
  departamentoId: number
  email?: string | null
}

export const createConfiguracoesService = (database: typeof db) => {
  const repo = createConfiguracoesRepository(database)

  return {
    async getDepartamentos() {
      return await repo.getDepartamentos()
    },

    async updateDepartamentoEmail(input: UpdateDepartamentoEmailInput) {
      await repo.updateDepartamentoEmail(input.departamentoId, input.email ?? null)
      return { success: true }
    },

    async getEmailIC() {
      const config = await repo.getConfiguracaoSistema(EMAIL_IC_CHAVE)
      return config?.valor ?? null
    },

    async setEmailIC(email: string | null) {
      await repo.setConfiguracaoSistema(EMAIL_IC_CHAVE, email)
      return { success: true }
    },
  }
}

export const configuracoesService = createConfiguracoesService(db)
