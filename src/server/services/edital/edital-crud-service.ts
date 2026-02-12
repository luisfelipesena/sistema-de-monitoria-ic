import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import { emailService } from '@/server/lib/email'
import {
  TIPO_EDITAL_DCC,
  SEMESTRE_LABELS,
  type CreateEditalInput,
  type EditalWithPeriodoStatus,
  type UpdateEditalInput,
} from '@/types'
import { logger } from '@/utils/logger'
import { env } from '@/utils/env'
import { randomBytes } from 'crypto'
import type { EditalRepository } from './edital-repository'

const log = logger.child({ context: 'EditalCrudService' })

const TOKEN_EXPIRY_HOURS = 72 // Token expires in 72 hours
const INSCRICAO_PATH = '/home/student/inscricao-monitoria'

function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

function generateInscricaoLink(): string {
  const baseUrl = env.CLIENT_URL || 'http://localhost:3000'
  return `${baseUrl}${INSCRICAO_PATH}`
}

export function createEditalCrudService(
  repo: EditalRepository,
  getEdital: (id: number) => Promise<EditalWithPeriodoStatus | null>
) {
  return {
    async createEdital(input: CreateEditalInput) {
      const numeroEditalExistente = await repo.findByNumeroEdital(input.numeroEdital)
      if (numeroEditalExistente) {
        throw new ConflictError('Este número de edital já está em uso.')
      }

      const periodoSobreposicao = await repo.findOverlappingPeriodo(
        input.ano,
        input.semestre,
        input.dataInicioInscricao,
        input.dataFimInscricao
      )

      if (periodoSobreposicao) {
        throw new ValidationError('Já existe um período de inscrição que sobrepõe às datas informadas')
      }

      const novoPeriodo = await repo.insertPeriodo({
        ano: input.ano,
        semestre: input.semestre,
        dataInicio: input.dataInicioInscricao,
        dataFim: input.dataFimInscricao,
        numeroEditalPrograd: input.numeroEditalPrograd,
      })

      const novoEdital = await repo.insert({
        periodoInscricaoId: novoPeriodo.id,
        tipo: input.tipo,
        numeroEdital: input.numeroEdital,
        titulo: input.titulo,
        descricaoHtml: input.descricaoHtml || null,
        valorBolsa: input.valorBolsa || '400.00',
        fileIdPdfExterno: input.fileIdPdfExterno || null,
        dataInicioSelecao: input.dataInicioSelecao || null,
        dataFimSelecao: input.dataFimSelecao || null,
        linkFormularioInscricao: generateInscricaoLink(),
        datasProvasDisponiveis: input.datasProvasDisponiveis ? JSON.stringify(input.datasProvasDisponiveis) : null,
        dataDivulgacaoResultado: input.dataDivulgacaoResultado || null,
        criadoPorUserId: input.criadoPorUserId,
        publicado: false,
      })

      log.info({ editalId: novoEdital.id, periodoId: novoPeriodo.id }, 'Novo edital e período criados')

      // Return the edital with relations (matching getEdital return type)
      const edital = await getEdital(novoEdital.id)
      if (!edital) {
        throw new NotFoundError('Edital', novoEdital.id)
      }
      // getEdital returns the correct format with periodoInscricao.status already set
      return edital
    },

    async updateEdital(input: UpdateEditalInput) {
      const edital = await repo.findByIdWithRelations(input.id)
      if (!edital) {
        throw new NotFoundError('Edital', input.id)
      }

      if (
        input.ano !== undefined ||
        input.semestre !== undefined ||
        input.dataInicioInscricao !== undefined ||
        input.dataFimInscricao !== undefined
      ) {
        const novoAno = input.ano ?? edital.periodoInscricao?.ano
        const novoSemestre = input.semestre ?? edital.periodoInscricao?.semestre
        const novaDataInicio = input.dataInicioInscricao ?? edital.periodoInscricao?.dataInicio
        const novaDataFim = input.dataFimInscricao ?? edital.periodoInscricao?.dataFim

        if (!novoAno || !novoSemestre || !novaDataInicio || !novaDataFim) {
          throw new ValidationError('Dados do período de inscrição incompletos')
        }

        const periodoSobreposicao = await repo.findOverlappingPeriodo(
          novoAno,
          novoSemestre,
          novaDataInicio,
          novaDataFim,
          edital.periodoInscricaoId
        )

        if (periodoSobreposicao) {
          throw new ValidationError('As novas datas sobrepõem a um período existente')
        }

        await repo.updatePeriodo(edital.periodoInscricaoId, {
          ano: novoAno,
          semestre: novoSemestre,
          dataInicio: novaDataInicio,
          dataFim: novaDataFim,
          ...(input.numeroEditalPrograd !== undefined && { numeroEditalPrograd: input.numeroEditalPrograd }),
        })
      } else if (input.numeroEditalPrograd !== undefined) {
        await repo.updatePeriodo(edital.periodoInscricaoId, {
          numeroEditalPrograd: input.numeroEditalPrograd,
        })
      }

      const updateData: Record<string, unknown> = {}
      if (input.numeroEdital !== undefined) updateData.numeroEdital = input.numeroEdital
      if (input.titulo !== undefined) updateData.titulo = input.titulo
      if (input.descricaoHtml !== undefined) updateData.descricaoHtml = input.descricaoHtml
      if (input.valorBolsa !== undefined) updateData.valorBolsa = input.valorBolsa
      if (input.dataInicioSelecao !== undefined) updateData.dataInicioSelecao = input.dataInicioSelecao
      if (input.dataFimSelecao !== undefined) updateData.dataFimSelecao = input.dataFimSelecao
      if (input.datasProvasDisponiveis !== undefined) {
        updateData.datasProvasDisponiveis = input.datasProvasDisponiveis
          ? JSON.stringify(input.datasProvasDisponiveis)
          : null
      }
      if (input.dataDivulgacaoResultado !== undefined) {
        updateData.dataDivulgacaoResultado = input.dataDivulgacaoResultado || null
      }

      const updated = await repo.update(input.id, updateData)
      return updated
    },

    async updateNumeroEdital(id: number, numeroEdital: string) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      // Check if another edital uses this number
      const existing = await repo.findByNumeroEdital(numeroEdital)
      if (existing && existing.id !== id) {
        throw new ConflictError('Este número de edital já está em uso.')
      }

      const updated = await repo.update(id, { numeroEdital })
      log.info({ editalId: id, numeroEdital }, 'Número do edital atualizado')
      return updated
    },

    async deleteEdital(id: number) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      await repo.delete(id)
      await repo.deletePeriodo(edital.periodoInscricaoId)

      log.info({ editalId: id, periodoId: edital.periodoInscricaoId }, 'Edital e período excluídos')
    },

    async uploadSignedEdital(id: number, fileId: string, adminUserId: number) {
      const updated = await repo.update(id, { fileIdAssinado: fileId })
      if (!updated) {
        throw new NotFoundError('Edital', id)
      }

      log.info({ editalId: id, fileId, adminUserId }, 'Edital assinado enviado')
      return updated
    },

    async setAvailableExamDates(
      id: number,
      datasProvasDisponiveis: string[],
      dataDivulgacaoResultado?: Date,
      adminUserId?: number
    ) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      if (edital.tipo !== TIPO_EDITAL_DCC) {
        throw new ValidationError('Datas de prova só podem ser definidas para editais internos DCC')
      }

      const updated = await repo.update(id, {
        datasProvasDisponiveis: JSON.stringify(datasProvasDisponiveis),
        dataDivulgacaoResultado: dataDivulgacaoResultado || null,
      })

      log.info({ editalId: id, datasCount: datasProvasDisponiveis.length, adminUserId }, 'Datas de prova definidas')
      return updated
    },

    async requestChefeSignature(input: {
      id: number
      chefeEmail?: string
      chefeNome?: string
      requestedByUserId: number
    }) {
      const { id, chefeEmail, chefeNome, requestedByUserId } = input
      if (!chefeEmail) {
        throw new ValidationError('Email do chefe do departamento é obrigatório')
      }

      const edital = await repo.findByIdWithRelations(id)
      if (!edital || !edital.periodoInscricao) {
        throw new NotFoundError('Edital', id)
      }

      if (edital.chefeAssinouEm) {
        throw new ValidationError('Este edital já foi assinado pelo chefe do departamento')
      }

      if (!edital.titulo) {
        throw new ValidationError('O edital precisa ter um título antes de solicitar assinatura')
      }

      // Check if there's already a pending token
      const existingToken = await repo.findPendingTokenByEditalId(id)
      if (existingToken) {
        // Expire the old token
        await repo.expireToken(existingToken.id)
      }

      // Generate new token
      const token = generateSecureToken()
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

      await repo.createSignatureToken({
        editalId: id,
        token,
        chefeEmail,
        chefeNome: chefeNome || null,
        expiresAt,
        requestedByUserId,
      })

      // Send email to chefe
      const semestreFormatado = SEMESTRE_LABELS[edital.periodoInscricao.semestre]

      await emailService.sendChefeSignatureRequest({
        chefeEmail,
        chefeNome,
        editalNumero: edital.numeroEdital,
        editalTitulo: edital.titulo,
        semestreFormatado,
        ano: edital.periodoInscricao.ano,
        signatureToken: token,
        expiresAt,
        remetenteUserId: requestedByUserId,
      })

      log.info(
        { editalId: id, chefeEmail, requestedBy: requestedByUserId },
        'Solicitação de assinatura enviada ao chefe'
      )
      return {
        success: true,
        message: `Link de assinatura enviado para ${chefeEmail}. O link expira em ${TOKEN_EXPIRY_HOURS} horas.`,
        expiresAt,
      }
    },

    async signAsChefe(id: number, assinatura: string, userId: number) {
      const professor = await repo.findProfessorById(userId)
      if (!professor) {
        throw new ForbiddenError('Apenas professores podem assinar como chefe')
      }

      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      if (edital.chefeAssinouEm) {
        throw new ValidationError('Este edital já foi assinado pelo chefe')
      }

      const updated = await repo.update(id, {
        chefeAssinatura: assinatura,
        chefeAssinouEm: new Date(),
        chefeDepartamentoId: userId,
      })

      log.info({ editalId: id, chefeDepartamentoId: userId }, 'Edital assinado pelo chefe')
      return updated
    },

    async getEditalByToken(token: string) {
      const tokenData = await repo.findSignatureTokenByToken(token)

      if (!tokenData) {
        throw new NotFoundError('Token', token)
      }

      if (tokenData.status === 'USED') {
        throw new ValidationError('Este link de assinatura já foi utilizado')
      }

      if (tokenData.status === 'EXPIRED' || tokenData.expiresAt < new Date()) {
        throw new ValidationError('Este link de assinatura expirou. Solicite um novo link ao coordenador.')
      }

      if (!tokenData.edital) {
        throw new NotFoundError('Edital', tokenData.editalId)
      }

      if (tokenData.edital.chefeAssinouEm) {
        throw new ValidationError('Este edital já foi assinado')
      }

      return {
        token: tokenData,
        edital: tokenData.edital,
      }
    },

    async signEditalByToken(token: string, assinatura: string, chefeNome: string) {
      const tokenData = await repo.findSignatureTokenByToken(token)

      if (!tokenData) {
        throw new NotFoundError('Token', token)
      }

      if (tokenData.status === 'USED') {
        throw new ValidationError('Este link de assinatura já foi utilizado')
      }

      if (tokenData.status === 'EXPIRED' || tokenData.expiresAt < new Date()) {
        throw new ValidationError('Este link de assinatura expirou. Solicite um novo link ao coordenador.')
      }

      const edital = await repo.findById(tokenData.editalId)
      if (!edital) {
        throw new NotFoundError('Edital', tokenData.editalId)
      }

      if (edital.chefeAssinouEm) {
        throw new ValidationError('Este edital já foi assinado')
      }

      // Update edital with signature
      const updated = await repo.update(tokenData.editalId, {
        chefeAssinatura: assinatura,
        chefeAssinouEm: new Date(),
      })

      // Mark token as used
      await repo.markTokenAsUsed(tokenData.id)

      log.info(
        { editalId: tokenData.editalId, chefeEmail: tokenData.chefeEmail, chefeNome },
        'Edital assinado pelo chefe via token'
      )

      return {
        success: true,
        message: 'Edital assinado com sucesso!',
        edital: updated,
      }
    },
  }
}

export type EditalCrudService = ReturnType<typeof createEditalCrudService>
