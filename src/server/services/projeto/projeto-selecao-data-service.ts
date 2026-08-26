import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { studentEmailService } from '@/server/lib/email'
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import { getSelecaoSchedule } from '@/server/lib/selecao-schedule'
import { parseSlots } from '@/server/services/edital/parse-slots'
import type { Projeto } from '@/server/db/schema'
import { STATUS_INSCRICAO_SUBMITTED } from '@/types'
import type { UserRole } from '@/types/enums'
import type { SlotDataHorario, UpdateSelecaoDataPatch } from '@/types/selecao-inputs'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoSelecaoDataService' })

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

  async function notifyCandidates(projeto: Projeto, remetenteUserId: number) {
    const inscricoes = await repo.findInscricoesWithUserByProjetoId(projeto.id)

    const candidatos = [
      ...new Map(
        inscricoes
          .filter(({ inscricao }) => inscricao.status === STATUS_INSCRICAO_SUBMITTED)
          .map((inscricao) => [inscricao.aluno.id, inscricao])
      ).values(),
    ]
    if (candidatos.length === 0) return 0

    try {
      const result = await studentEmailService.sendSelectionScheduleUpdated(
        candidatos.map(({ aluno, user }) => ({
          studentName: aluno.nomeCompleto,
          studentEmail: user.email,
          projectTitle: projeto.titulo,
          schedule: getSelecaoSchedule(projeto),
          projetoId: projeto.id,
          alunoId: aluno.id,
          remetenteUserId,
        }))
      )

      if (result.failed.length > 0) {
        log.warn({ projetoId: projeto.id, failed: result.failed.length }, 'Falha ao notificar parte dos candidatos')
      }
      return result.sent
    } catch (error) {
      log.error({ projetoId: projeto.id, error }, 'Falha ao preparar notificações dos candidatos')
      return 0
    }
  }

  return {
    /**
     * Choose a single date/time slot for the projeto's selection exam.
     * Validates that the slot is within the edital's date/time range.
     * Professor must choose exactly 1 slot.
     */
    async chooseSlots(projetoId: number, slots: SlotDataHorario[], userId: number, userRole: UserRole) {
      if (slots.length !== 1) {
        throw new ValidationError('Selecione exatamente 1 data/horário')
      }

      const projeto = await repo.findByIdWithEdital(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      // If project has no editalInterno linked, try to find one by ano/semestre and link it
      let editalInterno = projeto.editalInterno
      if (!editalInterno && repo.findEditalByAnoSemestre) {
        const editalBySemestre = await repo.findEditalByAnoSemestre(projeto.ano, projeto.semestre)
        if (editalBySemestre) {
          await repo.update(projetoId, { editalInternoId: editalBySemestre.id })
          editalInterno = editalBySemestre
          log.info(
            { projetoId, editalId: editalBySemestre.id },
            'Projeto vinculado automaticamente ao edital por ano/semestre (chooseSlots)'
          )
        }
      }

      if (!editalInterno) {
        throw new ValidationError('Projeto não está vinculado a um edital interno')
      }

      const edital = editalInterno
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

      const notificationsSent = updated ? await notifyCandidates(updated, userId) : 0

      log.info({ projetoId, slots, userId }, 'Slots de seleção escolhidos')
      return { projeto: updated, notificationsSent }
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

      // If project has no editalInterno linked, try to find one by ano/semestre and link it
      let editalInterno = projeto.editalInterno
      if (!editalInterno && repo.findEditalByAnoSemestre) {
        const editalBySemestre = await repo.findEditalByAnoSemestre(projeto.ano, projeto.semestre)
        if (editalBySemestre) {
          await repo.update(projetoId, { editalInternoId: editalBySemestre.id })
          editalInterno = editalBySemestre
          log.info(
            { projetoId, editalId: editalBySemestre.id },
            'Projeto vinculado automaticamente ao edital por ano/semestre (chooseSlot)'
          )
        }
      }

      if (!editalInterno) {
        throw new ValidationError('Projeto não está vinculado a um edital interno')
      }

      const availableSlots = parseSlots(editalInterno.datasProvasDisponiveis)

      const slotExists = availableSlots.some((slot) => slot.data === data && slot.horario === horario)

      if (!slotExists) {
        throw new ValidationError('Opção de data/horário inválida')
      }

      const updated = await repo.update(projetoId, {
        dataSelecaoEscolhida: new Date(data),
        horarioSelecao: horario,
        datasSelecaoEscolhidas: JSON.stringify([{ data, horario }]),
      })

      const notificationsSent = updated ? await notifyCandidates(updated, userId) : 0

      log.info({ projetoId, data, horario, userId }, 'Slot de seleção escolhido')
      return { projeto: updated, notificationsSent }
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

      // Validate that selection dates are chosen (minimum 1)
      const datasRaw = (projeto as Record<string, unknown>).datasSelecaoEscolhidas as string | null
      const datasEscolhidas = parseSlots(datasRaw)
      const hasLegacyDate = !!projeto.dataSelecaoEscolhida

      if (datasEscolhidas.length < 1 && !hasLegacyDate) {
        throw new ValidationError('É necessário escolher 1 data/horário de seleção antes de confirmar')
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

    async updateSelecaoData(projetoId: number, patch: UpdateSelecaoDataPatch, userId: number, userRole: UserRole) {
      const projeto = await repo.findById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      await verifyAuthorization(projeto, userId, userRole)

      // Validate: cannot save empty pontos de prova
      if (patch.pontosProva !== undefined && !patch.pontosProva.trim()) {
        throw new ValidationError('Os pontos de prova são obrigatórios e não podem ficar vazios')
      }

      // Validate: cannot save empty bibliografia
      if (patch.bibliografia !== undefined && !patch.bibliografia.trim()) {
        throw new ValidationError('A bibliografia é obrigatória e não pode ficar vazia')
      }

      const updateData: UpdateSelecaoDataPatch & { dadosEditalConfirmados?: boolean } = {}
      if (patch.pontosProva !== undefined) {
        updateData.pontosProva = patch.pontosProva.trim()
      }
      if (patch.bibliografia !== undefined) {
        updateData.bibliografia = patch.bibliografia.trim()
      }
      if (patch.localSelecao !== undefined) {
        updateData.localSelecao = patch.localSelecao?.trim() || null
      }
      if (patch.pontosProva !== undefined || patch.bibliografia !== undefined) {
        updateData.dadosEditalConfirmados = false
      }
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('Informe pelo menos um dado da seleção para atualizar')
      }

      const updated = await repo.update(projetoId, updateData)

      if (
        (patch.pontosProva !== undefined || patch.bibliografia !== undefined) &&
        repo.findFirstDisciplinaForProjeto &&
        repo.upsertProjetoTemplate
      ) {
        const disciplina = await repo.findFirstDisciplinaForProjeto(projetoId)
        if (disciplina) {
          await repo.upsertProjetoTemplate(disciplina.id, {
            pontosProvaDefault: patch.pontosProva,
            bibliografiaDefault: patch.bibliografia,
            userId,
          })
        }
      }

      const localAnterior = projeto.localSelecao?.trim() || null
      const localAtual = patch.localSelecao !== undefined ? (updateData.localSelecao ?? null) : localAnterior
      const notificationsSent =
        patch.localSelecao !== undefined && localAtual !== localAnterior && updated
          ? await notifyCandidates(updated, userId)
          : 0

      log.info(
        { projetoId, userId, fieldsUpdated: Object.keys(updateData) },
        'Dados de seleção atualizados e propagados para o template'
      )
      return { projeto: updated, notificationsSent }
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
      const inscricoesCountPromise = repo.getInscricoesCountByProjetoId(projetoId)

      // If project has no editalInterno linked, try to find one by ano/semestre and link it
      let editalInterno = projeto.editalInterno
      if (!editalInterno && repo.findEditalByAnoSemestre) {
        const editalBySemestre = await repo.findEditalByAnoSemestre(projeto.ano, projeto.semestre)
        if (editalBySemestre) {
          // Auto-link the project to the edital for future requests
          await repo.update(projetoId, { editalInternoId: editalBySemestre.id })
          editalInterno = editalBySemestre
          log.info(
            { projetoId, editalId: editalBySemestre.id },
            'Projeto vinculado automaticamente ao edital por ano/semestre'
          )
        }
      }

      const slotsDisponiveis = editalInterno ? parseSlots(editalInterno.datasProvasDisponiveis) : []
      const datasEscolhidas = parseSlots((projeto as Record<string, unknown>).datasSelecaoEscolhidas as string | null)

      // Fallback: if new multi-slot field is empty but legacy fields exist, build from legacy
      const datasEscolhidasFinal =
        datasEscolhidas.length > 0
          ? datasEscolhidas
          : projeto.dataSelecaoEscolhida && projeto.horarioSelecao
            ? [{ data: projeto.dataSelecaoEscolhida.toISOString().split('T')[0], horario: projeto.horarioSelecao }]
            : []

      // Build range info from edital
      const rangeSelecao =
        editalInterno?.dataInicioSelecao && editalInterno?.dataFimSelecao
          ? {
              dataInicio: editalInterno.dataInicioSelecao.toISOString().split('T')[0],
              dataFim: editalInterno.dataFimSelecao.toISOString().split('T')[0],
              horarioInicio: editalInterno.horarioInicioSelecao ?? null,
              horarioFim: editalInterno.horarioFimSelecao ?? null,
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

      const inscricoesCount = await inscricoesCountPromise

      return {
        projetoId: projeto.id,
        dataSelecaoEscolhida: projeto.dataSelecaoEscolhida?.toISOString().split('T')[0] ?? null,
        horarioSelecao: projeto.horarioSelecao ?? null,
        datasSelecaoEscolhidas: datasEscolhidasFinal,
        voluntariosSolicitados: projeto.voluntariosSolicitados ?? 0,
        voluntariosConfirmados: projeto.voluntariosConfirmados ?? false,
        dadosEditalConfirmados: projeto.dadosEditalConfirmados ?? false,
        localSelecao: projeto.localSelecao ?? null,
        bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? 0,
        pontosProva: projeto.pontosProva || templatePontos || null,
        bibliografia: projeto.bibliografia || templateBibliografia || null,
        slotsDisponiveis,
        rangeSelecao,
        hasEditalInterno: !!editalInterno,
        totalInscritos: Number(inscricoesCount[0]?.count ?? 0),
      }
    },
  }
}

export type ProjetoSelecaoDataService = ReturnType<typeof createProjetoSelecaoDataService>
