import { db } from '@/server/db'
import { ConflictError } from '@/server/lib/errors'
import { createConfiguracoesRepository } from './configuracoes-repository'

export const EMAIL_IC_CHAVE = 'EMAIL_INSTITUTO_COMPUTACAO'

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

    // --- Email Notificação ---

    async getEmailsNotificacao() {
      return await repo.getEmailsNotificacao()
    },

    async createEmailNotificacao(input: { nome: string; email: string; descricao?: string | null }) {
      const existing = await repo.findEmailNotificacaoByEmail(input.email)
      if (existing) {
        throw new ConflictError('Este email já está cadastrado na lista de notificação.')
      }
      return await repo.createEmailNotificacao(input)
    },

    async updateEmailNotificacao(input: { id: number; nome?: string; email?: string; descricao?: string | null }) {
      if (input.email) {
        const existing = await repo.findEmailNotificacaoByEmail(input.email, input.id)
        if (existing) {
          throw new ConflictError('Este email já está cadastrado na lista de notificação.')
        }
      }
      await repo.updateEmailNotificacao(input.id, {
        nome: input.nome,
        email: input.email,
        descricao: input.descricao,
      })
      return { success: true }
    },

    async deleteEmailNotificacao(id: number) {
      await repo.deleteEmailNotificacao(id)
      return { success: true }
    },

    async getEmailIC() {
      const config = await repo.getConfiguracaoSistema(EMAIL_IC_CHAVE)
      return config?.valor ?? null
    },

    async setEmailIC(email: string | null) {
      await repo.upsertConfiguracaoSistema(EMAIL_IC_CHAVE, email, 'Email institucional do Instituto de Computação')
      return { success: true }
    },

    async getEmailsNotificacaoEdital() {
      const [emailsNotificacao, emailICConfig] = await Promise.all([
        repo.getEmailsNotificacao(),
        repo.getConfiguracaoSistema(EMAIL_IC_CHAVE),
      ])

      const emails: string[] = []

      // Adiciona emails da tabela de notificação
      for (const item of emailsNotificacao) {
        if (item.email) {
          emails.push(item.email)
        }
      }

      // Adiciona o email do IC
      if (emailICConfig?.valor) {
        emails.push(emailICConfig.valor)
      }

      // Remove duplicatas
      return [...new Set(emails)]
    },
  }
}

export const configuracoesService = createConfiguracoesService(db)
