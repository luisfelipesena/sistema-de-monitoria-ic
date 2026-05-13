import type { db } from '@/server/db'
import { projetoTable, vagaTable } from '@/server/db/schema'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import type { Semestre, TipoVaga } from '@/types'
import {
  PROJETO_STATUS_APPROVED,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  SEMESTRE_1,
  TIPO_VAGA_BOLSISTA,
} from '@/types'
import { logger } from '@/utils/logger'
import { and, asc, count, eq, inArray } from 'drizzle-orm'
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

    // FASE 5: Move 1 bolsa from a project with surplus to a project with demanda.
    // Net-zero accounting: only adjusts projetoTable.bolsasDisponibilizadas.
    // Vagas already exist (created by vagas-service.acceptVaga); no new vaga creation here.
    async redistribuirBolsa(fromProjetoId: number, toProjetoId: number) {
      if (fromProjetoId === toProjetoId) {
        throw new BusinessError('Origem e destino não podem ser o mesmo projeto', 'INVALID_INPUT')
      }

      return await db.transaction(async (tx) => {
        const sortedIds = [fromProjetoId, toProjetoId].sort((a, b) => a - b)

        const lockedProjetos = await tx
          .select({
            id: projetoTable.id,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
            status: projetoTable.status,
            bolsasSolicitadas: projetoTable.bolsasSolicitadas,
            bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          })
          .from(projetoTable)
          .where(inArray(projetoTable.id, sortedIds))
          .orderBy(asc(projetoTable.id))
          .for('update')

        if (lockedProjetos.length !== 2) {
          throw new NotFoundError('Projeto', `${fromProjetoId} ou ${toProjetoId}`)
        }

        const fromProjeto = lockedProjetos.find((p) => p.id === fromProjetoId)
        const toProjeto = lockedProjetos.find((p) => p.id === toProjetoId)

        if (!fromProjeto || !toProjeto) {
          throw new NotFoundError('Projeto', `${fromProjetoId} ou ${toProjetoId}`)
        }

        if (fromProjeto.ano !== toProjeto.ano || fromProjeto.semestre !== toProjeto.semestre) {
          throw new BusinessError('Projetos devem ser do mesmo período (ano/semestre)', 'DIFFERENT_PERIOD')
        }

        if (fromProjeto.status !== PROJETO_STATUS_APPROVED || toProjeto.status !== PROJETO_STATUS_APPROVED) {
          throw new BusinessError('Ambos os projetos devem estar APROVADOS', 'NOT_APPROVED')
        }

        const [fromVagasRow] = await tx
          .select({ count: count() })
          .from(vagaTable)
          .where(and(eq(vagaTable.projetoId, fromProjetoId), eq(vagaTable.tipo, TIPO_VAGA_BOLSISTA)))

        const [toVagasRow] = await tx
          .select({ count: count() })
          .from(vagaTable)
          .where(and(eq(vagaTable.projetoId, toProjetoId), eq(vagaTable.tipo, TIPO_VAGA_BOLSISTA)))

        const fromBolsasAlocadas = fromVagasRow?.count ?? 0
        const toBolsasAlocadas = toVagasRow?.count ?? 0
        const fromDisp = fromProjeto.bolsasDisponibilizadas ?? 0
        const toDisp = toProjeto.bolsasDisponibilizadas ?? 0

        if (fromDisp - fromBolsasAlocadas < 1) {
          throw new BusinessError('Projeto origem não tem bolsa em surplus para transferir', 'NO_SURPLUS')
        }

        if (toBolsasAlocadas <= toDisp) {
          throw new BusinessError(
            'Projeto destino não tem demanda (não há aluno aceito acima da cota atual)',
            'NO_DEMAND'
          )
        }

        if (toDisp + 1 > toProjeto.bolsasSolicitadas) {
          throw new BusinessError(
            'Projeto destino atingiria o limite de bolsas solicitadas pelo professor',
            'EXCEEDS_REQUESTED'
          )
        }

        // Net-zero invariant against PROGRAD period limit (defensive, always passes for redistribuição)
        await validateAllocationLimits([
          {
            projetoId: fromProjeto.id,
            ano: fromProjeto.ano,
            semestre: fromProjeto.semestre as Semestre,
            oldValue: fromDisp,
            newValue: fromDisp - 1,
          },
          {
            projetoId: toProjeto.id,
            ano: toProjeto.ano,
            semestre: toProjeto.semestre as Semestre,
            oldValue: toDisp,
            newValue: toDisp + 1,
          },
        ])

        await tx
          .update(projetoTable)
          .set({ bolsasDisponibilizadas: fromDisp - 1 })
          .where(eq(projetoTable.id, fromProjetoId))

        await tx
          .update(projetoTable)
          .set({ bolsasDisponibilizadas: toDisp + 1 })
          .where(eq(projetoTable.id, toProjetoId))

        log.info({ fromProjetoId, toProjetoId, fromNew: fromDisp - 1, toNew: toDisp + 1 }, 'Bolsa redistribuída')

        return {
          success: true,
          from: { id: fromProjetoId, bolsasDisponibilizadas: fromDisp - 1 },
          to: { id: toProjetoId, bolsasDisponibilizadas: toDisp + 1 },
        }
      })
    },
  }
}

export type ScholarshipAllocationService = ReturnType<typeof createScholarshipAllocationService>
