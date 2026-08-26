import { NotFoundError } from '@/server/lib/errors'
import { getEnrollmentPeriodStatus } from '@/server/lib/enrollment-period'
import type { Semestre, TipoEdital } from '@/types'
import { PERIODO_INSCRICAO_STATUS_ATIVO, PERIODO_INSCRICAO_STATUS_FINALIZADO } from '@/types/schemas'
import { logger } from '@/utils/logger'
import type { EditalRepository } from './edital-repository'
import { parseSlots } from './parse-slots'

const _log = logger.child({ context: 'EditalQueryService' })

export function createEditalQueryService(repo: EditalRepository) {
  const getPeriodStatus = (period?: { dataInicio: Date; dataFim: Date } | null) =>
    period ? getEnrollmentPeriodStatus(period) : PERIODO_INSCRICAO_STATUS_FINALIZADO

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
        const statusPeriodo = getPeriodStatus(edital.periodoInscricao)

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

      const statusPeriodo = getPeriodStatus(edital.periodoInscricao)

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
        const statusPeriodo = getPeriodStatus(edital.periodoInscricao)

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
              status: getPeriodStatus(edital.periodoInscricao),
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
        const statusPeriodo = getPeriodStatus(edital.periodoInscricao)

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

    async getNumeroEditalPrograd(ano: number, semestre: Semestre) {
      const periodo = await repo.findPeriodoBySemestre(ano, semestre)
      return periodo?.numeroEditalPrograd || null
    },

    async getAvailableExamDates(id: number) {
      const edital = await repo.findById(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      const rangeSelecao =
        edital.dataInicioSelecao && edital.dataFimSelecao && edital.horarioInicioSelecao && edital.horarioFimSelecao
          ? {
              dataInicio: edital.dataInicioSelecao.toISOString().split('T')[0],
              dataFim: edital.dataFimSelecao.toISOString().split('T')[0],
              horarioInicio: edital.horarioInicioSelecao,
              horarioFim: edital.horarioFimSelecao,
            }
          : null

      return {
        datasProvasDisponiveis: parseSlots(edital.datasProvasDisponiveis ?? null),
        dataDivulgacaoResultado: edital.dataDivulgacaoResultado,
        rangeSelecao,
      }
    },
  }
}

export type EditalQueryService = ReturnType<typeof createEditalQueryService>
