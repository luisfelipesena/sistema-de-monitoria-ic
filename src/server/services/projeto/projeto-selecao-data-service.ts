import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import type { UserRole } from '@/types/enums'
import type { SlotDataHorario } from '@/types/selecao-inputs'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoSelecaoDataService' })

/**
 * Parses the datasProvasDisponiveis JSON string from the edital into SlotDataHorario[].
 * Supports both new format (array of objects) and legacy format (array of strings).
 */
function parseSlots(raw: string | null): SlotDataHorario[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Legacy format: array of strings like "2025-03-15 14:00-16:00"
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      log.warn({ raw }, 'Formato legado detectado em datasProvasDisponiveis')
      return parsed.map((s: string) => {
        const [data, horario] = s.split(' ')
        return { data: data || '', horario: horario || '' }
      })
    }
    // New format: array of objects { data, horario }
    return parsed.filter((s: unknown): s is SlotDataHorario => {
      if (typeof s !== 'object' || s === null) return false
      const obj = s as Record<string, unknown>
      return typeof obj.data === 'string' && typeof obj.horario === 'string'
    })
  } catch {
    log.warn({ raw }, 'Falha ao deserializar datasProvasDisponiveis')
    return []
  }
}

export function createProjetoSelecaoDataService(repo: ProjetoRepository) {
  /**
   * Verifies authorization: professor can only edit their own project.
   * Admins can edit any project.
   */
  async function verifyAuthorization(
    projeto: { professorResponsavelId: number },
    userId: number,
    userRole: UserRole
  ) {
    if (isProfessor(userRole) && !isAdmin(userRole)) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor || projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Acesso negado a este projeto')
      }
    }
  }

  return {
    /**
     * Choose a date/time slot for the projeto's selection exam.
     * Validates that the submitted {data, horario} pair matches one of the
     * edital's datasProvasDisponiveis slots.
     */
    async chooseSlot(
      projetoId: number,
      data: string,
      horario: string,
      userId: number,
      userRole: UserRole
    ) {
      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      if (!projeto.editalInterno) {
        throw new ValidationError('Projeto não está vinculado a um edital interno')
      }

      const availableSlots = parseSlots(projeto.editalInterno.datasProvasDisponiveis)

      const slotExists = availableSlots.some(
        (slot) => slot.data === data && slot.horario === horario
      )

      if (!slotExists) {
        throw new ValidationError('Opção de data/horário inválida')
      }

      const updated = await repo.update(projetoId, {
        dataSelecaoEscolhida: new Date(data),
        horarioSelecao: horario,
      })

      log.info({ projetoId, data, horario, userId }, 'Slot de seleção escolhido')
      return updated
    },

    /**
     * Update the number of requested volunteers for the projeto.
     * Validates that the value is >= 0.
     */
    async updateVoluntarios(
      projetoId: number,
      value: number,
      userId: number,
      userRole: UserRole
    ) {
      if (value < 0) {
        throw new ValidationError('Valor deve ser zero ou positivo')
      }

      const projeto = await repo.findById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      const updated = await repo.update(projetoId, {
        voluntariosSolicitados: value,
      })

      log.info({ projetoId, value, userId }, 'Voluntários solicitados atualizado')
      return updated
    },

    /**
     * Update textual selection data fields (pontosProva, bibliografia).
     */
    async updateSelecaoData(
      projetoId: number,
      pontosProva: string | undefined,
      bibliografia: string | undefined,
      userId: number,
      userRole: UserRole
    ) {
      const projeto = await repo.findById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      const updateData: Record<string, unknown> = {}
      if (pontosProva !== undefined) {
        updateData.pontosProva = pontosProva
      }
      if (bibliografia !== undefined) {
        updateData.bibliografia = bibliografia
      }

      const updated = await repo.update(projetoId, updateData)

      log.info({ projetoId, userId, fieldsUpdated: Object.keys(updateData) }, 'Dados de seleção atualizados')
      return updated
    },

    /**
     * Get selection info for a project: current selection state + available slots from its edital.
     */
    async getSelecaoInfo(
      projetoId: number,
      userId: number,
      userRole: UserRole
    ) {
      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      const slotsDisponiveis = projeto.editalInterno
        ? parseSlots(projeto.editalInterno.datasProvasDisponiveis)
        : []

      return {
        projetoId: projeto.id,
        dataSelecaoEscolhida: projeto.dataSelecaoEscolhida?.toISOString().split('T')[0] ?? null,
        horarioSelecao: projeto.horarioSelecao ?? null,
        voluntariosSolicitados: projeto.voluntariosSolicitados ?? 0,
        bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? 0,
        pontosProva: projeto.pontosProva ?? null,
        bibliografia: projeto.bibliografia ?? null,
        slotsDisponiveis,
        hasEditalInterno: !!projeto.editalInterno,
      }
    },

    /** Exposed for testing */
    parseSlots,
  }
}

export type ProjetoSelecaoDataService = ReturnType<typeof createProjetoSelecaoDataService>
