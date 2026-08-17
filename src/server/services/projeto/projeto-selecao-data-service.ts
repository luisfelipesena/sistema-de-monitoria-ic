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

/**
 * Parses the datasSelecaoEscolhidas JSON string from the projeto into SlotDataHorario[].
 */
function parseDatasEscolhidas(raw: string | null): SlotDataHorario[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s: unknown): s is SlotDataHorario => {
      if (typeof s !== 'object' || s === null) return false
      const obj = s as Record<string, unknown>
      return typeof obj.data === 'string' && typeof obj.horario === 'string'
    })
  } catch {
    return []
  }
}

/**
 * Validates that a slot is within the edital's allowed range.
 */
function isSlotWithinRange(
  slot: SlotDataHorario,
  dataInicio: string,
  dataFim: string,
  horarioInicio: string,
  horarioFim: string
): boolean {
  // Validate date is within range
  if (slot.data < dataInicio || slot.data > dataFim) return false
  // Validate time is within range
  if (slot.horario < horarioInicio || slot.horario > horarioFim) return false
  return true
}

export function createProjetoSelecaoDataService(repo: ProjetoRepository) {
  /**
   * Verifies authorization: professor can only edit their own project.
   * Admins can edit any project.
   */
  async function verifyAuthorization(projeto: { professorResponsavelId: number }, userId: number, userRole: UserRole) {
    if (isProfessor(userRole) && !isAdmin(userRole)) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor || projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Acesso negado a este projeto')
      }
    }
  }

  return {
    /**
     * Choose date/time slots for the projeto's selection exam.
     * Validates that each slot is within the edital's date/time range.
     * Professor can choose up to 3 slots.
     */
    async chooseSlots(projetoId: number, slots: SlotDataHorario[], userId: number, userRole: UserRole) {
      if (slots.length === 0 || slots.length > 3) {
        throw new ValidationError('Selecione entre 2 e 3 datas/horários')
      }

      if (slots.length < 2) {
        throw new ValidationError('É necessário selecionar no mínimo 2 datas/horários')
      }

      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      if (!projeto.editalInterno) {
        throw new ValidationError('Projeto não está vinculado a um edital interno')
      }

      const edital = projeto.editalInterno
      const dataInicio = edital.dataInicioSelecao?.toISOString().split('T')[0]
      const dataFim = edital.dataFimSelecao?.toISOString().split('T')[0]
      const horarioInicio = edital.horarioInicioSelecao
      const horarioFim = edital.horarioFimSelecao

      // If range is defined, validate slots against it
      if (dataInicio && dataFim && horarioInicio && horarioFim) {
        for (const slot of slots) {
          if (!isSlotWithinRange(slot, dataInicio, dataFim, horarioInicio, horarioFim)) {
            throw new ValidationError(
              `Data/horário ${slot.data} ${slot.horario} está fora do range permitido (${dataInicio} a ${dataFim}, ${horarioInicio} - ${horarioFim})`
            )
          }
        }
      } else {
        // Legacy: validate against discrete slots
        const availableSlots = parseSlots(edital.datasProvasDisponiveis)
        for (const slot of slots) {
          const slotExists = availableSlots.some((s) => s.data === slot.data && s.horario === slot.horario)
          if (!slotExists) {
            throw new ValidationError(`Opção de data/horário ${slot.data} ${slot.horario} inválida`)
          }
        }
      }

      // Save the chosen slots as JSON + keep legacy fields for backward compatibility
      const updated = await repo.update(projetoId, {
        datasSelecaoEscolhidas: JSON.stringify(slots),
        // Keep first slot in legacy fields for backward compatibility
        dataSelecaoEscolhida: new Date(slots[0].data),
        horarioSelecao: slots[0].horario,
        // Reset edital confirmation when dates change
        dadosEditalConfirmados: false,
      })

      log.info({ projetoId, slots, userId }, 'Slots de seleção escolhidos')
      return updated
    },

    /**
     * Legacy: Choose a single date/time slot for the projeto's selection exam.
     * Kept for backward compatibility.
     */
    async chooseSlot(projetoId: number, data: string, horario: string, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      if (!projeto.editalInterno) {
        throw new ValidationError('Projeto não está vinculado a um edital interno')
      }

      const availableSlots = parseSlots(projeto.editalInterno.datasProvasDisponiveis)

      const slotExists = availableSlots.some((slot) => slot.data === data && slot.horario === horario)

      if (!slotExists) {
        throw new ValidationError('Opção de data/horário inválida')
      }

      const updated = await repo.update(projetoId, {
        dataSelecaoEscolhida: new Date(data),
        horarioSelecao: horario,
        datasSelecaoEscolhidas: JSON.stringify([{ data, horario }]),
      })

      log.info({ projetoId, data, horario, userId }, 'Slot de seleção escolhido')
      return updated
    },

    /**
     * Update the number of requested volunteers for the projeto.
     * Validates that the value is >= 0. Resets confirmation status.
     */
    async updateVoluntarios(projetoId: number, value: number, userId: number, userRole: UserRole) {
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
        voluntariosConfirmados: false,
        dadosEditalConfirmados: false,
      })

      log.info({ projetoId, value, userId }, 'Voluntários solicitados atualizado')
      return updated
    },

    /**
     * Confirm the number of volunteers for the projeto.
     * Only after confirmation, the number appears in the edital PDF table.
     */
    async confirmVoluntarios(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      const updated = await repo.update(projetoId, {
        voluntariosConfirmados: true,
      })

      log.info({ projetoId, userId }, 'Voluntários confirmados pelo professor')
      return updated
    },

    /**
     * Confirm all edital data for the projeto at once.
     * Validates that dates, pontos de prova, and bibliografia are all filled.
     * Sets dadosEditalConfirmados=true and voluntariosConfirmados=true.
     */
    async confirmDadosEdital(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      // Validate that selection dates are chosen (minimum 2)
      const datasRaw = (projeto as Record<string, unknown>).datasSelecaoEscolhidas as string | null
      const datasEscolhidas = parseDatasEscolhidas(datasRaw)
      const hasLegacyDate = !!projeto.dataSelecaoEscolhida

      if (datasEscolhidas.length < 2 && !hasLegacyDate) {
        throw new ValidationError('É necessário escolher no mínimo 2 datas/horários de seleção antes de confirmar')
      }

      // Even with legacy date, enforce minimum 2 for new flow
      if (datasEscolhidas.length < 2 && hasLegacyDate) {
        throw new ValidationError('É necessário escolher no mínimo 2 datas/horários de seleção antes de confirmar')
      }

      // Validate that voluntários are confirmed
      if (!projeto.voluntariosConfirmados) {
        throw new ValidationError(
          'É necessário confirmar o número de voluntários antes de confirmar os dados para o edital'
        )
      }

      // Validate pontos de prova
      // Check project field, then template fallback
      let hasPontos = !!projeto.pontosProva?.trim()
      if (!hasPontos && repo.findFirstDisciplinaForProjeto && repo.findProjetoTemplateByDisciplinaId) {
        const disciplina = await repo.findFirstDisciplinaForProjeto(projetoId)
        if (disciplina) {
          const template = await repo.findProjetoTemplateByDisciplinaId(disciplina.id)
          hasPontos = !!template?.pontosProvaDefault?.trim()
        }
      }

      if (!hasPontos) {
        throw new ValidationError('É necessário preencher os pontos de prova antes de confirmar')
      }

      // Validate bibliografia
      let hasBibliografia = !!projeto.bibliografia?.trim()
      if (!hasBibliografia && repo.findFirstDisciplinaForProjeto && repo.findProjetoTemplateByDisciplinaId) {
        const disciplina = await repo.findFirstDisciplinaForProjeto(projetoId)
        if (disciplina) {
          const template = await repo.findProjetoTemplateByDisciplinaId(disciplina.id)
          hasBibliografia = !!template?.bibliografiaDefault?.trim()
        }
      }

      if (!hasBibliografia) {
        throw new ValidationError('É necessário preencher a bibliografia antes de confirmar')
      }

      // All validations passed — confirm everything
      const updated = await repo.update(projetoId, {
        dadosEditalConfirmados: true,
        voluntariosConfirmados: true,
      })

      log.info(
        { projetoId, userId },
        'Dados do edital confirmados pelo professor (datas, pontos, bibliografia, voluntários)'
      )
      return updated
    },

    /**
     * Update textual selection data fields (pontosProva, bibliografia).
     * Validates that values are not empty when provided.
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

      // Validate: cannot save empty pontos de prova
      if (pontosProva !== undefined && !pontosProva.trim()) {
        throw new ValidationError('Os pontos de prova são obrigatórios e não podem ficar vazios')
      }

      // Validate: cannot save empty bibliografia
      if (bibliografia !== undefined && !bibliografia.trim()) {
        throw new ValidationError('A bibliografia é obrigatória e não pode ficar vazia')
      }

      const updateData: Record<string, unknown> = {}
      if (pontosProva !== undefined) {
        updateData.pontosProva = pontosProva
      }
      if (bibliografia !== undefined) {
        updateData.bibliografia = bibliografia
      }

      // Reset edital confirmation when pontos/bibliografia change
      updateData.dadosEditalConfirmados = false

      const updated = await repo.update(projetoId, updateData)

      // Also propagate the updated points of proof / bibliography to the discipline template
      if (repo.findFirstDisciplinaForProjeto && repo.upsertProjetoTemplate) {
        const disciplina = await repo.findFirstDisciplinaForProjeto(projetoId)
        if (disciplina) {
          await repo.upsertProjetoTemplate(disciplina.id, {
            pontosProvaDefault: pontosProva,
            bibliografiaDefault: bibliografia,
            userId,
          })
        }
      }

      log.info(
        { projetoId, userId, fieldsUpdated: Object.keys(updateData) },
        'Dados de seleção atualizados e propagados para o template'
      )
      return updated
    },

    /**
     * Get selection info for a project: current selection state + range/slots from its edital.
     * Falls back to discipline template defaults for pontosProva & bibliografia if empty on project.
     */
    async getSelecaoInfo(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      const slotsDisponiveis = projeto.editalInterno ? parseSlots(projeto.editalInterno.datasProvasDisponiveis) : []
      const datasEscolhidas = parseDatasEscolhidas(
        (projeto as Record<string, unknown>).datasSelecaoEscolhidas as string | null
      )

      // Fallback: if new multi-slot field is empty but legacy fields exist, build from legacy
      const datasEscolhidasFinal =
        datasEscolhidas.length > 0
          ? datasEscolhidas
          : projeto.dataSelecaoEscolhida && projeto.horarioSelecao
            ? [{ data: projeto.dataSelecaoEscolhida.toISOString().split('T')[0], horario: projeto.horarioSelecao }]
            : []

      // Build range info from edital
      const editalI = projeto.editalInterno
      const rangeSelecao =
        editalI?.dataInicioSelecao && editalI?.dataFimSelecao
          ? {
              dataInicio: editalI.dataInicioSelecao.toISOString().split('T')[0],
              dataFim: editalI.dataFimSelecao.toISOString().split('T')[0],
              horarioInicio: editalI.horarioInicioSelecao ?? null,
              horarioFim: editalI.horarioFimSelecao ?? null,
            }
          : null

      // Fetch discipline template default values if project values are missing
      let templatePontos: string | null = null
      let templateBibliografia: string | null = null

      if (repo.findFirstDisciplinaForProjeto && repo.findProjetoTemplateByDisciplinaId) {
        const disciplina = await repo.findFirstDisciplinaForProjeto(projetoId)
        if (disciplina) {
          const template = await repo.findProjetoTemplateByDisciplinaId(disciplina.id)
          if (template) {
            templatePontos = template.pontosProvaDefault ?? null
            templateBibliografia = template.bibliografiaDefault ?? null
          }
        }
      }

      return {
        projetoId: projeto.id,
        dataSelecaoEscolhida: projeto.dataSelecaoEscolhida?.toISOString().split('T')[0] ?? null,
        horarioSelecao: projeto.horarioSelecao ?? null,
        datasSelecaoEscolhidas: datasEscolhidasFinal,
        voluntariosSolicitados: projeto.voluntariosSolicitados ?? 0,
        voluntariosConfirmados: projeto.voluntariosConfirmados ?? false,
        dadosEditalConfirmados: projeto.dadosEditalConfirmados ?? false,
        bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? 0,
        pontosProva: projeto.pontosProva || templatePontos || null,
        bibliografia: projeto.bibliografia || templateBibliografia || null,
        slotsDisponiveis,
        rangeSelecao,
        hasEditalInterno: !!projeto.editalInterno,
      }
    },

    /** Exposed for testing */
    parseSlots,
    parseDatasEscolhidas,
  }
}

export type ProjetoSelecaoDataService = ReturnType<typeof createProjetoSelecaoDataService>
