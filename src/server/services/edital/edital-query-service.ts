import { NotFoundError } from '@/server/lib/errors'
import type { Semestre, TipoEdital } from '@/types'
import {
  PERIODO_INSCRICAO_STATUS_ATIVO,
  PERIODO_INSCRICAO_STATUS_FINALIZADO,
  PERIODO_INSCRICAO_STATUS_FUTURO,
  type PeriodoInscricaoStatus,
} from '@/types/schemas'
import { logger } from '@/utils/logger'
import type { EditalRepository } from './edital-repository'

const _log = logger.child({ context: 'EditalQueryService' })

export function createEditalQueryService(repo: EditalRepository) {
  const calculatePeriodStatus = (edital: {
    periodoInscricao?: { dataInicio: Date; dataFim: Date } | null
  }): PeriodoInscricaoStatus => {
    const now = new Date()
    let statusPeriodo: PeriodoInscricaoStatus = PERIODO_INSCRICAO_STATUS_FINALIZADO
    if (edital.periodoInscricao) {
      const inicio = new Date(edital.periodoInscricao.dataInicio)
      const fim = new Date(edital.periodoInscricao.dataFim)

      if (now >= inicio && now <= fim) {
        statusPeriodo = PERIODO_INSCRICAO_STATUS_ATIVO
      } else if (now < inicio) {
        statusPeriodo = PERIODO_INSCRICAO_STATUS_FUTURO
      }
    }
    return statusPeriodo
  }

  return {
    async getActivePeriod() {
      const activePeriod = await repo.findActivePeriodo()
      if (!activePeriod) {
        return { periodo: null, edital: null }
      }

      const editais = await repo.findBySemestre(activePeriod.ano, activePeriod.semestre)
      const edital = editais[0] || null

      const projectsCount = await repo.countApprovedProjectsByPeriod(activePeriod.ano, activePeriod.semestre)

      return {
        periodo: {
          ...activePeriod,
          status: PERIODO_INSCRICAO_STATUS_ATIVO,
          totalProjetos: projectsCount,
          totalInscricoes: 0,
        },
        edital,
      }
    },

    async getEditais() {
      const editais = await repo.findAll()

      return editais.map((edital) => {
        const statusPeriodo = calculatePeriodStatus(edital)

        return {
          ...edital,
          periodoInscricao: edital.periodoInscricao
            ? {
                ...edital.periodoInscricao,
                status: statusPeriodo,
                totalProjetos: 0,
                totalInscricoes: 0,
              }
            : null,
        }
      })
    },

    async getEdital(id: number) {
      const edital = await repo.findByIdWithRelations(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      const statusPeriodo = calculatePeriodStatus(edital)

      return {
        ...edital,
        periodoInscricao: edital.periodoInscricao
          ? {
              ...edital.periodoInscricao,
              status: statusPeriodo,
              totalProjetos: 0,
              totalInscricoes: 0,
            }
          : null,
      }
    },

    async getPublicEditais() {
      const editais = await repo.findPublished()

      return editais.map((edital) => {
        const statusPeriodo = calculatePeriodStatus(edital)

        return {
          ...edital,
          periodoInscricao: edital.periodoInscricao
            ? {
                ...edital.periodoInscricao,
                status: statusPeriodo,
                totalProjetos: 0,
                totalInscricoes: 0,
              }
            : null,
        }
      })
    },

    async getEditaisBySemestre(ano: number, semestre: Semestre, tipo?: TipoEdital, publicadoApenas = false) {
      const editais = await repo.findBySemestre(ano, semestre, tipo, publicadoApenas)

      return editais.map((edital) => ({
        ...edital,
        periodoInscricao: edital.periodoInscricao
          ? {
              ...edital.periodoInscricao,
              status: PERIODO_INSCRICAO_STATUS_ATIVO,
              totalProjetos: 0,
              totalInscricoes: 0,
            }
          : null,
      }))
    },

    async getCurrentEditalForSemestre(ano: number, semestre: Semestre) {
      const periodo = await repo.findPeriodoBySemestre(ano, semestre)
      if (!periodo) return null

      const editais = await repo.findBySemestre(ano, semestre, undefined, true)
      return editais[0] || null
    },

    async getEditaisParaAssinar() {
      const editais = await repo.findPendingSignature()

      return editais.map((edital) => {
        const statusPeriodo = calculatePeriodStatus(edital)

        return {
          ...edital,
          periodoInscricao: edital.periodoInscricao
            ? {
                ...edital.periodoInscricao,
                status: statusPeriodo,
                totalProjetos: 0,
                totalInscricoes: 0,
              }
            : null,
        }
      })
    },

    async getAvailableExamDates(id: number) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      return {
        datasProvasDisponiveis: edital.datasProvasDisponiveis ? JSON.parse(edital.datasProvasDisponiveis) : null,
        dataDivulgacaoResultado: edital.dataDivulgacaoResultado,
      }
    },
  }
}

export type EditalQueryService = ReturnType<typeof createEditalQueryService>
