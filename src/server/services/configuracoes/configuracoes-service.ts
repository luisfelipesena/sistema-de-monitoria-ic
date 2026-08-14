import { db } from '@/server/db'
import { createConfiguracoesRepository } from './configuracoes-repository'

export const EMAIL_IC_CHAVE = 'EMAIL_INSTITUTO_COMPUTACAO'
export const EMAIL_GERAL_PROFESSORES_CHAVE = 'EMAIL_GERAL_PROFESSORES'
export const EMAIL_GERAL_ESTUDANTES_CHAVE = 'EMAIL_GERAL_ESTUDANTES'

export interface UpdateDepartamentoEmailInput {
  departamentoId: number
  email?: string | null
}

export interface CreateDepartamentoInput {
  nome: string
  sigla?: string | null
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

    async createDepartamento(input: CreateDepartamentoInput) {
      const result = await repo.createDepartamento({
        nome: input.nome,
        sigla: input.sigla ?? null,
        emailInstituto: input.email ?? null,
        unidadeUniversitaria: 'Instituto de Computação',
      })
      return result
    },

    async updateDepartamento(input: {
      departamentoId: number
      nome?: string
      sigla?: string | null
      email?: string | null
    }) {
      const data: { nome?: string; sigla?: string | null; emailInstituto?: string | null } = {}
      if (input.nome !== undefined) data.nome = input.nome
      if (input.sigla !== undefined) data.sigla = input.sigla
      if (input.email !== undefined) data.emailInstituto = input.email
      await repo.updateDepartamento(input.departamentoId, data)
      return { success: true }
    },

    async deleteDepartamento(departamentoId: number) {
      await repo.deleteDepartamento(departamentoId)
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

    async getEmailGeralProfessores() {
      const config = await repo.getConfiguracaoSistema(EMAIL_GERAL_PROFESSORES_CHAVE)
      return config?.valor ?? null
    },

    async setEmailGeralProfessores(email: string | null) {
      await repo.upsertConfiguracaoSistema(
        EMAIL_GERAL_PROFESSORES_CHAVE,
        email,
        'Email geral dos professores para notificação de publicação de edital'
      )
      return { success: true }
    },

    async getEmailGeralEstudantes() {
      const config = await repo.getConfiguracaoSistema(EMAIL_GERAL_ESTUDANTES_CHAVE)
      return config?.valor ?? null
    },

    async setEmailGeralEstudantes(email: string | null) {
      await repo.upsertConfiguracaoSistema(
        EMAIL_GERAL_ESTUDANTES_CHAVE,
        email,
        'Email geral dos estudantes para notificação de publicação de edital'
      )
      return { success: true }
    },

    async getEmailsNotificacaoEdital() {
      const [profConfig, estConfig] = await Promise.all([
        repo.getConfiguracaoSistema(EMAIL_GERAL_PROFESSORES_CHAVE),
        repo.getConfiguracaoSistema(EMAIL_GERAL_ESTUDANTES_CHAVE),
      ])
      const emails: string[] = []
      if (profConfig?.valor) emails.push(profConfig.valor)
      if (estConfig?.valor) emails.push(estConfig.valor)
      return emails
    },
  }
}

export const configuracoesService = createConfiguracoesService(db)
