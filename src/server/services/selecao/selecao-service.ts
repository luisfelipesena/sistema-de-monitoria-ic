import type { db } from '@/server/db'
import { isAdmin, requireAdminOrProfessor, requireProfessor } from '@/server/lib/auth-helpers'
import { studentEmailService } from '@/server/lib/email'
import { BusinessError, ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import type {
  AtaSelecaoData,
  CreateAtaInput,
  GenerateAtaDataInput,
  PublishResultsInput,
  SelectMonitorsInput,
  Semestre,
  SignAtaInput,
  UserRole,
} from '@/types'
import {
  PROFESSOR,
  STATUS_INSCRICAO_CONFIRMED_INTEREST,
  STATUS_INSCRICAO_REJECTED_BY_PROFESSOR,
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
  STATUS_INSCRICAO_SUBMITTED,
  STUDENT,
  TIPO_ASSINATURA_ATA_SELECAO,
  TIPO_INSCRICAO_BOLSISTA,
  TIPO_INSCRICAO_VOLUNTARIO,
} from '@/types'
import { ResultadoSelecaoTemplate } from '@/server/lib/pdfTemplates/resultado-selecao'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { sanitizeForFilename } from '@/utils/string-normalization'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { createSelecaoRepository } from './selecao-repository'

const log = logger.child({ context: 'SelecaoService' })
const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

type Database = typeof db

export function createSelecaoService(db: Database) {
  const repo = createSelecaoRepository(db)

  return {
    async generateAtaData(input: GenerateAtaDataInput) {
      const { projetoId, userId, userRole } = input

      const projetoData = await repo.findProjetoWithRelations(parseInt(projetoId))

      if (!projetoData) {
        throw new NotFoundError('Projeto', 'não encontrado')
      }

      if (userRole === PROFESSOR && projetoData.professorResponsavel?.userId !== userId) {
        throw new ForbiddenError('Você só pode gerar atas para seus próprios projetos')
      }

      const allInscricoes = await repo.findInscricoesByProjetoId(parseInt(projetoId))

      if (userRole === STUDENT) {
        const studentInscricao = allInscricoes.find((i) => i.aluno?.userId === userId)
        if (!studentInscricao) {
          throw new ForbiddenError('Você não possui inscrição neste projeto')
        }
        if (studentInscricao.status === STATUS_INSCRICAO_SUBMITTED && !studentInscricao.notaFinal) {
          throw new ForbiddenError('Os resultados deste projeto ainda não foram publicados pelo professor')
        }
      }
      const inscricoesWithNota = await repo.findInscricoesWithNotaFinal(parseInt(projetoId))

      const inscricoesBolsista = allInscricoes.filter(
        (i) =>
          i.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA ||
          i.tipoVagaPretendida === 'ANY' ||
          i.status === 'SELECTED_BOLSISTA' ||
          i.status === 'ACCEPTED_BOLSISTA' ||
          !i.tipoVagaPretendida
      )
      const inscricoesVoluntario = allInscricoes.filter(
        (i) =>
          i.tipoVagaPretendida === TIPO_INSCRICAO_VOLUNTARIO ||
          i.status === 'SELECTED_VOLUNTARIO' ||
          i.status === 'ACCEPTED_VOLUNTARIO'
      )

      const disciplinas = await repo.findDisciplinasByProjetoId(parseInt(projetoId))

      log.info({ projetoId }, 'Ata data generated successfully')

      return {
        projeto: {
          ...projetoData,
          disciplinas: disciplinas.map((d) => d.disciplina),
        },
        totalInscritos: allInscricoes.length,
        totalCompareceram: inscricoesWithNota.length,
        inscricoesBolsista,
        inscricoesVoluntario,
        dataGeracao: new Date(),
      }
    },

    async createAtaRecord(input: CreateAtaInput) {
      const { projetoId, userId, userRole } = input

      requireAdminOrProfessor(userRole)

      const projetoData = await repo.findProjetoById(parseInt(projetoId))

      if (!projetoData) {
        throw new NotFoundError('Projeto', 'não encontrado')
      }

      const ataExistente = await repo.findAtaByProjetoId(parseInt(projetoId))

      if (ataExistente) {
        throw new ValidationError('Ata já existe para este projeto')
      }

      const ataRecord = await repo.createAta({
        projetoId: parseInt(projetoId),
        geradoPorUserId: userId,
      })

      log.info({ projetoId, ataId: ataRecord.id }, 'Ata record created successfully')

      return {
        success: true,
        ataId: ataRecord.id,
        message: 'Registro de ata criado com sucesso',
      }
    },

    async signAta(input: SignAtaInput) {
      const { ataId, assinaturaBase64, userId, userRole } = input

      requireProfessor(userRole)

      const ata = await repo.findAtaById(ataId)

      if (!ata) {
        throw new NotFoundError('Ata', 'não encontrada')
      }

      if (ata.projeto.professorResponsavel?.userId !== userId) {
        throw new ForbiddenError('Você só pode assinar atas de seus próprios projetos')
      }

      const assinaturaExistente = await repo.findAssinatura(ata.projetoId, userId)

      if (assinaturaExistente) {
        throw new ValidationError('Ata já foi assinada')
      }

      await db.transaction(async (tx) => {
        const txRepo = createSelecaoRepository(tx as unknown as Database)
        await txRepo.createAssinatura({
          assinaturaData: assinaturaBase64,
          tipoAssinatura: TIPO_ASSINATURA_ATA_SELECAO,
          userId: userId,
          projetoId: ata.projetoId,
        })

        await txRepo.updateAtaAssinado(ataId)
      })

      log.info({ ataId, userId }, 'Ata signed successfully')

      return {
        success: true,
        message: 'Ata assinada com sucesso',
      }
    },

    async publishResults(input: PublishResultsInput) {
      const { projetoId, notifyStudents, mensagemPersonalizada, userId, userRole } = input

      requireAdminOrProfessor(userRole)

      const projetoData = await repo.findProjetoWithRelations(parseInt(projetoId))

      if (!projetoData) {
        throw new NotFoundError('Projeto', 'não encontrado')
      }

      if (!isAdmin(userRole) && projetoData.professorResponsavel?.userId !== userId) {
        throw new ForbiddenError('Você só pode publicar resultados para seus próprios projetos')
      }

      const inscricoes = await repo.findInscricoesByProjetoId(parseInt(projetoId))

      try {
        await db.transaction(async (tx) => {
          const txRepo = createSelecaoRepository(tx as unknown as Database)
          await Promise.all(
            inscricoes.map((inscricao) => {
              const aprovado = inscricao.notaFinal && Number(inscricao.notaFinal) >= 7.0
              // Approved students go to WAITING_LIST (waiting for them to confirm interest)
              // Rejected students go to REJECTED_BY_PROFESSOR
              const status = aprovado ? 'WAITING_LIST' : STATUS_INSCRICAO_REJECTED_BY_PROFESSOR
              return txRepo.updateInscricaoStatus(inscricao.id, status)
            })
          )
        })
      } catch (error) {
        log.error({ error, projetoId }, 'Error updating inscription status')
        throw new BusinessError('Falha ao atualizar o status das inscrições no banco de dados.', 'INTERNAL_ERROR')
      }

      if (notifyStudents && inscricoes.length > 0) {
        let attachments: Array<{ filename: string; content: Buffer; contentType: string }> = []
        try {
          const rawAtaData = await this.generateAtaData({ projetoId, userId, userRole })
          const ataData: AtaSelecaoData = {
            ...rawAtaData,
            projeto: {
              ...rawAtaData.projeto,
              departamento: rawAtaData.projeto.departamento || { nome: 'N/A', sigla: null },
            },
            candidatos: [...rawAtaData.inscricoesBolsista, ...rawAtaData.inscricoesVoluntario].map((c) => ({
              id: c.id,
              aluno: c.aluno,
              tipoVagaPretendida: c.tipoVagaPretendida,
              notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
              notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
              coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
              notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
              status: c.status,
              observacoes: c.feedbackProfessor,
            })),
            ataInfo: {
              dataSelecao: new Date().toLocaleDateString('pt-BR'),
              localSelecao: 'Online via Sistema de Monitoria',
              observacoes: mensagemPersonalizada || 'Processo seletivo concluído.',
            },
          }

          const pdfElementBolsista = React.createElement(ResultadoSelecaoTemplate, {
            data: ataData,
            tipo: 'BOLSISTA',
          }) as React.ReactElement<DocumentProps>
          const pdfBufferBolsista = await renderToBuffer(pdfElementBolsista)

          const pdfElementVoluntario = React.createElement(ResultadoSelecaoTemplate, {
            data: ataData,
            tipo: 'VOLUNTARIO',
          }) as React.ReactElement<DocumentProps>
          const pdfBufferVoluntario = await renderToBuffer(pdfElementVoluntario)

          const sanitizedTitle = sanitizeForFilename(projetoData.titulo)
          attachments = [
            {
              filename: `Resultado_Bolsista_${sanitizedTitle}.pdf`,
              content: Buffer.from(pdfBufferBolsista),
              contentType: 'application/pdf',
            },
            {
              filename: `Resultado_Voluntario_${sanitizedTitle}.pdf`,
              content: Buffer.from(pdfBufferVoluntario),
              contentType: 'application/pdf',
            },
          ]
        } catch (pdfErr) {
          log.warn({ pdfErr, projetoId }, 'Falha ao gerar anexo PDF do resultado da seleção')
        }

        const emailPromises = inscricoes.map(async (inscricaoItem) => {
          const aprovado = inscricaoItem.notaFinal && Number(inscricaoItem.notaFinal) >= 7.0
          // For the email, we still show what type they applied for (informational)
          const status = aprovado
            ? inscricaoItem.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA
              ? STATUS_INSCRICAO_SELECTED_BOLSISTA
              : STATUS_INSCRICAO_SELECTED_VOLUNTARIO
            : STATUS_INSCRICAO_REJECTED_BY_PROFESSOR

          return studentEmailService.sendSelectionResult(
            {
              studentName: inscricaoItem.aluno.user.username,
              studentEmail: inscricaoItem.aluno.user.email,
              projectTitle: projetoData.titulo,
              professorName: projetoData.professorResponsavel.nomeCompleto,
              status,
              linkConfirmacao: aprovado ? `${clientUrl}/home/student/resultados` : undefined,
              feedbackProfessor: mensagemPersonalizada,
              projetoId: parseInt(projetoId),
              alunoId: inscricaoItem.alunoId,
              attachments,
            },
            userId
          )
        })

        try {
          await Promise.all(emailPromises)
          log.info({ projetoId, count: inscricoes.length }, 'Notifications sent successfully')
        } catch (error) {
          log.error({ error, projetoId }, 'Error sending notifications')
        }
      }

      return {
        success: true,
        notificationsCount: inscricoes.length,
        message: 'Resultados publicados e notificações enviadas',
      }
    },

    async getProfessorProjectsWithCandidates(userId: number, userRole: UserRole) {
      requireProfessor(userRole)

      const professor = await repo.findProfessorByUserId(userId)

      if (!professor) {
        return []
      }

      const projetos = await repo.findProfessorApprovedProjects(professor.id)

      return projetos.map((projeto) => ({
        ...projeto,
        inscricoes: projeto.inscricoes.filter(
          (inscricao) =>
            inscricao.status === STATUS_INSCRICAO_SUBMITTED ||
            inscricao.status === STATUS_INSCRICAO_CONFIRMED_INTEREST ||
            inscricao.status === 'WAITING_LIST' ||
            inscricao.status?.startsWith('SELECTED_') ||
            inscricao.status?.startsWith('ACCEPTED_') ||
            inscricao.status === 'REJECTED_BY_STUDENT'
        ),
      }))
    },

    async selectMonitors(input: SelectMonitorsInput) {
      const { projetoId, bolsistas, voluntarios, motivoTroca, userId, userRole } = input

      requireProfessor(userRole)

      const professor = await repo.findProfessorByUserId(userId)

      if (!professor) {
        throw new NotFoundError('Professor', 'não encontrado')
      }

      const projeto = await repo.findProjetoById(projetoId)

      if (!projeto) {
        throw new NotFoundError('Projeto', 'não encontrado')
      }

      if (projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você só pode selecionar monitores para seus próprios projetos')
      }

      // Verify quotas
      const maxBolsistas = projeto.bolsasDisponibilizadas || 0
      const maxVoluntarios = projeto.voluntariosSolicitados || 0

      if (bolsistas.length > maxBolsistas) {
        throw new ValidationError(`Número de bolsistas excede o limite disponível (${maxBolsistas})`)
      }

      if (voluntarios.length > maxVoluntarios) {
        throw new ValidationError(`Número de voluntários excede o limite disponível (${maxVoluntarios})`)
      }

      // Verify that all selected candidates have notaFinal >= 7.0
      const allInscricoes = await repo.findInscricoesByProjetoId(projetoId)
      const selectedIds = [...bolsistas, ...voluntarios]
      for (const selectedId of selectedIds) {
        const candidate = allInscricoes.find((i) => i.id === selectedId)
        const candidateNota = candidate?.notaFinal ? Number(candidate.notaFinal) : null
        if (!candidate || candidateNota === null || candidateNota < 7.0) {
          const nomeStr = candidate?.aluno?.nomeCompleto || candidate?.aluno?.user?.username || `ID ${selectedId}`
          const notaStr = candidateNota !== null ? candidateNota.toFixed(1) : 'não lançada'
          throw new ValidationError(
            `O candidato ${nomeStr} possui nota final ${notaStr}. Para ser selecionado como monitor, a nota final deve ser no mínimo 7,0.`
          )
        }
        // Verify candidate has confirmed interest
        if (candidate.status !== STATUS_INSCRICAO_CONFIRMED_INTEREST) {
          const nomeStr = candidate?.aluno?.nomeCompleto || candidate?.aluno?.user?.username || `ID ${selectedId}`
          throw new ValidationError(
            `O candidato ${nomeStr} ainda não confirmou interesse em participar. Apenas candidatos que confirmaram interesse podem ser selecionados como monitores.`
          )
        }
      }

      // Check if professor is replacing a previously selected candidate - require motivo
      const currentInscricoes = await repo.findInscricoesByProjetoId(projetoId)
      const currentlySelected = currentInscricoes.filter(
        (i) => i.status === 'SELECTED_BOLSISTA' || i.status === 'SELECTED_VOLUNTARIO'
      )
      const isReplacingCandidate = currentlySelected.some(
        (i) => !bolsistas.includes(i.id) && !voluntarios.includes(i.id)
      )

      if (isReplacingCandidate && !motivoTroca) {
        throw new ValidationError('É obrigatório informar o motivo da troca de candidato ao redesignar a bolsa.')
      }

      await db.transaction(async (tx) => {
        const txRepo = createSelecaoRepository(tx as unknown as Database)

        // Get current inscricoes to preserve statuses
        const allInscricoesCurrent = await repo.findInscricoesByProjetoId(projetoId)
        const rejectedByStudentIds = allInscricoesCurrent
          .filter((i) => i.status === 'REJECTED_BY_STUDENT')
          .map((i) => i.id)
        // Track who was previously selected for bolsa (to mark as WAITING_LIST = "professor changed")
        const previouslySelectedIds = allInscricoesCurrent
          .filter(
            (i) => i.status === 'SELECTED_BOLSISTA' || i.status === 'SELECTED_VOLUNTARIO' || i.status === 'WAITING_LIST'
          )
          .map((i) => i.id)

        // Reset all inscricoes to SUBMITTED
        await txRepo.resetInscricoes(projetoId)

        // Restore REJECTED_BY_STUDENT status (preserve rejection history)
        if (rejectedByStudentIds.length > 0) {
          await Promise.all(
            rejectedByStudentIds.map((inscricaoId) => txRepo.updateInscricaoStatus(inscricaoId, 'REJECTED_BY_STUDENT'))
          )
        }

        // Set selected bolsistas
        if (bolsistas.length > 0) {
          await Promise.all(
            bolsistas.map((inscricaoId) => txRepo.updateInscricaoStatus(inscricaoId, 'SELECTED_BOLSISTA'))
          )
        }

        // Set selected voluntarios
        if (voluntarios.length > 0) {
          await Promise.all(
            voluntarios.map((inscricaoId) => txRepo.updateInscricaoStatus(inscricaoId, 'SELECTED_VOLUNTARIO'))
          )
        }

        // For unselected candidates:
        // - Previously selected by professor → WAITING_LIST (professor changed their mind) + save motivo
        // - Never selected → CONFIRMED_INTEREST
        const allSelected = [...bolsistas, ...voluntarios]
        const allInscricaoIds = await txRepo.getAllInscricaoIdsByProjetoId(projetoId)
        const unselected = allInscricaoIds.filter(
          (i) => !allSelected.includes(i.id) && !rejectedByStudentIds.includes(i.id)
        )

        if (unselected.length > 0) {
          await Promise.all(
            unselected.map((inscricao) => {
              const wasPreviouslySelected = previouslySelectedIds.includes(inscricao.id)
              const newStatus = wasPreviouslySelected ? 'WAITING_LIST' : STATUS_INSCRICAO_CONFIRMED_INTEREST
              const feedback = wasPreviouslySelected && motivoTroca ? motivoTroca : undefined
              return txRepo.updateInscricaoStatus(inscricao.id, newStatus, feedback)
            })
          )
        }
      })

      log.info(
        { projetoId, bolsistas: bolsistas.length, voluntarios: voluntarios.length },
        'Monitors selected successfully'
      )

      // Send scholarship notification email to selected bolsistas
      if (bolsistas.length > 0) {
        const projetoData = await repo.findProjetoWithRelations(projetoId)
        const allInscricoesData = await repo.findInscricoesByProjetoId(projetoId)

        const bolsistaInscricoes = allInscricoesData.filter((i) => bolsistas.includes(i.id))

        for (const inscricao of bolsistaInscricoes) {
          try {
            await studentEmailService.sendScholarshipSelectedNotification({
              studentName: inscricao.aluno.user.username || inscricao.aluno.nomeCompleto,
              studentEmail: inscricao.aluno.user.email,
              projectTitle: projetoData?.titulo || '',
              professorName: projetoData?.professorResponsavel?.nomeCompleto || '',
              projetoId,
              alunoId: inscricao.alunoId,
              remetenteUserId: userId,
            })
          } catch (error) {
            log.error({ error, inscricaoId: inscricao.id }, 'Error sending scholarship selected notification')
          }
        }

        log.info({ projetoId, count: bolsistaInscricoes.length }, 'Scholarship selection emails sent')
      }

      return {
        success: true,
        message: 'Monitores selecionados com sucesso',
        bolsistasSelecionados: bolsistas.length,
        voluntariosSelecionados: voluntarios.length,
      }
    },

    /**
     * Student confirms interest in participating after results are published.
     * Only applicable for students with status SELECTED_BOLSISTA or SELECTED_VOLUNTARIO.
     */
    async confirmInterest(inscricaoId: number, userId: number, userRole: UserRole) {
      if (userRole !== STUDENT) {
        throw new ForbiddenError('Apenas alunos podem confirmar interesse')
      }

      const inscricao = await repo.findInscricaoById(inscricaoId)

      if (!inscricao) {
        throw new NotFoundError('Inscrição', 'não encontrada')
      }

      // Verify the inscription belongs to this student
      if (inscricao.aluno?.userId !== userId) {
        throw new ForbiddenError('Você só pode confirmar interesse em suas próprias inscrições')
      }

      // Only allow confirming interest if status is WAITING_LIST (approved, awaiting interest confirmation)
      if (inscricao.status !== 'WAITING_LIST') {
        throw new BusinessError(
          'Você só pode confirmar interesse quando tiver sido aprovado(a) na seleção.',
          'INVALID_STATUS'
        )
      }

      await repo.updateInscricaoStatus(inscricaoId, STATUS_INSCRICAO_CONFIRMED_INTEREST)

      // Notify professor that student confirmed interest
      try {
        const profEmail =
          inscricao.projeto?.professorResponsavel?.user?.email ||
          inscricao.projeto?.professorResponsavel?.emailInstitucional

        if (profEmail) {
          const studentName = inscricao.aluno?.user?.username || inscricao.aluno?.nomeCompleto || 'Aluno'

          const { professorEmailService } = await import('@/server/lib/email')
          await professorEmailService.sendStudentConfirmedInterestNotification({
            professorEmail: profEmail,
            professorName: inscricao.projeto.professorResponsavel.nomeCompleto,
            studentName,
            studentMatricula: inscricao.aluno?.matricula || 'N/A',
            projectTitle: inscricao.projeto.titulo,
            notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal).toFixed(1) : 'N/A',
            linkSelecao: `${clientUrl}/home/professor/select-monitors`,
            projetoId: inscricao.projetoId,
            alunoId: inscricao.alunoId,
            remetenteUserId: userId,
          })
        }
      } catch (error) {
        log.error({ error, inscricaoId }, 'Error sending interest confirmation notification to professor')
      }

      log.info({ inscricaoId, userId }, 'Student confirmed interest')

      return {
        success: true,
        message: 'Interesse confirmado com sucesso! O professor será notificado.',
      }
    },

    /**
     * Student rejects participation in the selection process after results are published.
     * Sends email notification to the professor.
     */
    async rejectInterest(inscricaoId: number, userId: number, userRole: UserRole) {
      if (userRole !== STUDENT) {
        throw new ForbiddenError('Apenas alunos podem rejeitar participação')
      }

      const inscricao = await repo.findInscricaoById(inscricaoId)

      if (!inscricao) {
        throw new NotFoundError('Inscrição', 'não encontrada')
      }

      if (inscricao.aluno?.userId !== userId) {
        throw new ForbiddenError('Você só pode rejeitar participação em suas próprias inscrições')
      }

      if (inscricao.status !== 'WAITING_LIST') {
        throw new BusinessError(
          'Você só pode rejeitar participação quando tiver sido aprovado(a) na seleção.',
          'INVALID_STATUS'
        )
      }

      await repo.updateInscricaoStatus(inscricaoId, 'REJECTED_BY_STUDENT')

      // Notify professor that student rejected participation
      try {
        const profEmail =
          inscricao.projeto?.professorResponsavel?.user?.email ||
          inscricao.projeto?.professorResponsavel?.emailInstitucional

        if (profEmail) {
          const studentName = inscricao.aluno?.user?.username || inscricao.aluno?.nomeCompleto || 'Aluno'

          const { professorEmailService } = await import('@/server/lib/email')
          await professorEmailService.sendStudentRejectedInterestNotification({
            professorEmail: profEmail,
            professorName: inscricao.projeto.professorResponsavel.nomeCompleto,
            studentName,
            studentMatricula: inscricao.aluno?.matricula || 'N/A',
            projectTitle: inscricao.projeto.titulo,
            projetoId: inscricao.projetoId,
            alunoId: inscricao.alunoId,
            remetenteUserId: userId,
          })
        }
      } catch (error) {
        log.error({ error, inscricaoId }, 'Error sending rejection notification to professor')
      }

      log.info({ inscricaoId, userId }, 'Student rejected interest in selection process')

      return {
        success: true,
        message: 'Participação no processo seletivo rejeitada.',
      }
    },

    async getAtasForSigning(userId: number, userRole: UserRole) {
      requireProfessor(userRole)

      const atas = await repo.findAtasByProfessorId(userId)
      const atasFiltradas = atas.filter((ata) => ata.projeto.professorResponsavel.userId === userId)

      return atasFiltradas
    },

    // ========================================
    // ADMIN METHODS
    // ========================================

    async getAllProjectsWithSelectionStatus(filters: {
      ano?: number
      semestre?: Semestre
      departamentoId?: number
      projetoTitulo?: string
      professorResponsavel?: string
      status?: string | string[]
      limit?: number
      offset?: number
    }) {
      return repo.findAllProjectsWithSelectionStatus(filters)
    },

    async getAllAtasForAdmin(filters: {
      ano?: number
      semestre?: Semestre
      departamentoId?: number
      status?: 'DRAFT' | 'SIGNED'
      projetoTitulo?: string
      professorResponsavel?: string
      limit?: number
      offset?: number
    }) {
      return repo.findAllAtasForAdmin(filters)
    },
  }
}
