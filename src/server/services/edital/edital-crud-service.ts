import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import { TIPO_EDITAL_DCC, type CreateEditalInput, type EditalWithPeriodoStatus, type UpdateEditalInput } from '@/types'
import { logger } from '@/utils/logger'
import type { EditalRepository } from './edital-repository'

const log = logger.child({ context: 'EditalCrudService' })

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
        input.dataInicio,
        input.dataFim
      )

      if (periodoSobreposicao) {
        throw new ValidationError('Já existe um período de inscrição que sobrepõe às datas informadas')
      }

      const novoPeriodo = await repo.insertPeriodo({
        ano: input.ano,
        semestre: input.semestre,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
      })

      const novoEdital = await repo.insert({
        periodoInscricaoId: novoPeriodo.id,
        tipo: input.tipo,
        numeroEdital: input.numeroEdital,
        titulo: input.titulo,
        descricaoHtml: input.descricaoHtml || null,
        valorBolsa: input.valorBolsa || '400.00',
        fileIdProgradOriginal: input.fileIdProgradOriginal || null,
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
        input.dataInicio !== undefined ||
        input.dataFim !== undefined
      ) {
        const novoAno = input.ano ?? edital.periodoInscricao?.ano
        const novoSemestre = input.semestre ?? edital.periodoInscricao?.semestre
        const novaDataInicio = input.dataInicio ?? edital.periodoInscricao?.dataInicio
        const novaDataFim = input.dataFim ?? edital.periodoInscricao?.dataFim

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
        })
      }

      const updateData: Record<string, unknown> = {}
      if (input.numeroEdital !== undefined) updateData.numeroEdital = input.numeroEdital
      if (input.titulo !== undefined) updateData.titulo = input.titulo
      if (input.descricaoHtml !== undefined) updateData.descricaoHtml = input.descricaoHtml
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

    async requestChefeSignature(id: number, _chefeEmail: string | undefined, requestedByUserId: number) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      if (edital.chefeAssinouEm) {
        throw new ValidationError('Este edital já foi assinado pelo chefe do departamento')
      }

      if (!edital.titulo || !edital.descricaoHtml) {
        throw new ValidationError('O edital precisa estar completo antes de solicitar assinatura')
      }

      log.info({ editalId: id, requestedBy: requestedByUserId }, 'Assinatura do chefe solicitada')
      return { success: true, message: 'Solicitação de assinatura enviada com sucesso' }
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
  }
}

export type EditalCrudService = ReturnType<typeof createEditalCrudService>
