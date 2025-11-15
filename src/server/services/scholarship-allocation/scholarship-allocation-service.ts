import type { db } from '@/server/db'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import type { Semestre, TipoVaga } from '@/types'
import { SELECTED_BOLSISTA, SELECTED_VOLUNTARIO, SEMESTRE_1 } from '@/types'
import { logger } from '@/utils/logger'
import { createScholarshipAllocationRepository } from './scholarship-allocation-repository'

const log = logger.child({ context: 'ScholarshipAllocationService' })

type Database = typeof db

type AllocationAdjustment = {
  projetoId: number
  ano: number
  semestre: Semestre
  oldValue: number
  newValue: number
}

export function createScholarshipAllocationService(db: Database) {
  const repo = createScholarshipAllocationRepository(db)

  async function validateAllocationLimits(adjustments: AllocationAdjustment[]) {
    if (!adjustments.length) return

    const groups = new Map<string, { ano: number; semestre: Semestre; items: AllocationAdjustment[] }>()

    for (const adjustment of adjustments) {
      const key = `${adjustment.ano}-${adjustment.semestre}`
      if (!groups.has(key)) {
        groups.set(key, { ano: adjustment.ano, semestre: adjustment.semestre, items: [] })
      }
      groups.get(key)?.items.push(adjustment)
    }

    for (const group of groups.values()) {
      const periodo = await repo.findPeriodo(group.ano, group.semestre)

      if (!periodo) {
        throw new BusinessError(
          `Não há período de inscrição configurado para ${group.ano}.${
            group.semestre === SEMESTRE_1 ? '1' : '2'
          }. Defina o período antes de alocar bolsas.`,
          'MISSING_PERIODO'
        )
      }

      const limite = periodo.totalBolsasPrograd ?? 0

      if (limite <= 0) {
        throw new BusinessError(
          `Defina o total de bolsas PROGRAD para ${group.ano}.${
            group.semestre === SEMESTRE_1 ? '1' : '2'
          } antes de realizar a alocação.`,
          'MISSING_PROGRAD_LIMIT'
        )
      }

      const totalAtual = await repo.getTotalBolsasAlocadas(group.ano, group.semestre)
      const totalRemovido = group.items.reduce((acc, item) => acc + (item.oldValue || 0), 0)
      const totalAdicionado = group.items.reduce((acc, item) => acc + item.newValue, 0)
      const totalAtualizado = totalAtual - totalRemovido + totalAdicionado

      if (totalAtualizado > limite) {
        const excedente = totalAtualizado - limite
        throw new BusinessError(
          `A soma das bolsas (${totalAtualizado}) para ${group.ano}.${
            group.semestre === SEMESTRE_1 ? '1' : '2'
          } excede o limite definido (${limite}) em ${excedente}. Ajuste os valores antes de salvar.`,
          'LIMIT_EXCEEDED'
        )
      }
    }
  }

  return {
    async getApprovedProjects(ano: number, semestre: Semestre) {
      const projetos = await repo.getApprovedProjects(ano, semestre)

      const projetosWithDisciplinas = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await repo.getDisciplinasForProject(projeto.id)
          const bolsasAlocadas = await repo.getBolsasAlocadas(projeto.id)

          return {
            ...projeto,
            disciplinas,
            bolsasAlocadas,
          }
        })
      )

      return projetosWithDisciplinas
    },

    async updateScholarshipAllocation(projetoId: number, bolsasDisponibilizadas: number) {
      const projeto = await repo.findProjetoById(projetoId)

      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await validateAllocationLimits([
        {
          projetoId: projeto.id,
          ano: projeto.ano,
          semestre: projeto.semestre as Semestre,
          oldValue: projeto.bolsasDisponibilizadas || 0,
          newValue: bolsasDisponibilizadas,
        },
      ])

      await repo.updateBolsasDisponibilizadas(projetoId, bolsasDisponibilizadas)

      log.info({ projetoId, bolsasDisponibilizadas }, 'Bolsas disponibilizadas atualizadas')

      return { success: true }
    },

    async bulkUpdateAllocations(allocations: Array<{ projetoId: number; bolsasDisponibilizadas: number }>) {
      if (allocations.length === 0) {
        return { success: true }
      }

      const projetoIds = allocations.map((allocation) => allocation.projetoId)
      const projetos = await repo.findProjetosByIds(projetoIds)

      if (projetos.length !== projetoIds.length) {
        throw new BusinessError('Um ou mais projetos informados não foram encontrados.', 'PROJECTS_NOT_FOUND')
      }

      const adjustments: AllocationAdjustment[] = projetos.map((projeto) => {
        const novoValor = allocations.find((a) => a.projetoId === projeto.id)?.bolsasDisponibilizadas

        if (novoValor === undefined) {
          throw new BusinessError('Valor de bolsas não informado para um dos projetos selecionados.', 'MISSING_VALUE')
        }

        return {
          projetoId: projeto.id,
          ano: projeto.ano,
          semestre: projeto.semestre as Semestre,
          oldValue: projeto.bolsasDisponibilizadas || 0,
          newValue: novoValor,
        }
      })

      await validateAllocationLimits(adjustments)

      await Promise.all(
        allocations.map(async (allocation) => {
          await repo.updateBolsasDisponibilizadas(allocation.projetoId, allocation.bolsasDisponibilizadas)
        })
      )

      log.info({ count: allocations.length }, 'Alocações em massa atualizadas com sucesso')

      return { success: true }
    },

    async getAllocationSummary(ano: number, semestre: Semestre) {
      const summary = await repo.getAllocationSummary(ano, semestre)
      const departmentSummary = await repo.getDepartmentSummary(ano, semestre)

      return {
        summary,
        departmentSummary,
      }
    },

    async getCandidatesForProject(projetoId: number) {
      return repo.getCandidatesForProject(projetoId)
    },

    async allocateScholarshipToCandidate(inscricaoId: number, tipo: TipoVaga) {
      const statusMap = {
        BOLSISTA: SELECTED_BOLSISTA,
        VOLUNTARIO: SELECTED_VOLUNTARIO,
      }

      await repo.updateInscricaoStatus(inscricaoId, statusMap[tipo])

      const inscricao = await repo.findInscricaoById(inscricaoId)

      if (!inscricao) {
        throw new NotFoundError('Inscrição', inscricaoId)
      }

      await repo.createVaga(inscricao.alunoId, inscricao.projetoId, inscricao.id, tipo)

      log.info({ inscricaoId, tipo }, 'Bolsa alocada para candidato')

      return { success: true }
    },

    async setTotalScholarshipsFromPrograd(ano: number, semestre: Semestre, totalBolsas: number) {
      const periodo = await repo.findPeriodo(ano, semestre)

      if (periodo) {
        await repo.updateTotalBolsasPrograd(periodo.id, totalBolsas)

        log.info({ periodoId: periodo.id, totalBolsas }, 'Total de bolsas PROGRAD atualizado')

        return { success: true, totalBolsas }
      }

      log.warn({ ano, semestre }, 'Período de inscrição não encontrado para definir bolsas PROGRAD')
      throw new BusinessError('Período de inscrição não encontrado. Crie o período primeiro.', 'PERIODO_NOT_FOUND')
    },

    async getTotalProgradScholarships(ano: number, semestre: Semestre) {
      const periodo = await repo.findPeriodo(ano, semestre)

      return {
        totalBolsasPrograd: periodo?.totalBolsasPrograd || 0,
        periodoExists: !!periodo,
      }
    },
  }
}

export type ScholarshipAllocationService = ReturnType<typeof createScholarshipAllocationService>
