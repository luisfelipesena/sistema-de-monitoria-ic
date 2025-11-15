import type { db } from '@/server/db'
import { isAdmin, requireAdminOrProfessor, requireProfessor } from '@/server/lib/auth-helpers'
import { studentEmailService } from '@/server/lib/email'
import { BusinessError, ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import type {
  CreateAtaInput,
  GenerateAtaDataInput,
  PublishResultsInput,
  SelectMonitorsInput,
  SignAtaInput,
  UserRole,
} from '@/types'
import {
  STATUS_INSCRICAO_REJECTED_BY_PROFESSOR,
  STATUS_INSCRICAO_SELECTED_BOLSISTA,
  STATUS_INSCRICAO_SELECTED_VOLUNTARIO,
  STATUS_INSCRICAO_SUBMITTED,
  TIPO_ASSINATURA_ATA_SELECAO,
  TIPO_INSCRICAO_BOLSISTA,
  TIPO_INSCRICAO_VOLUNTARIO,
} from '@/types'
import { logger } from '@/utils/logger'
import { createSelecaoRepository } from './selecao-repository'

const log = logger.child({ context: 'SelecaoService' })

type Database = typeof db

export function createSelecaoService(db: Database) {
  const repo = createSelecaoRepository(db)

  return {
    async generateAtaData(input: GenerateAtaDataInput) {
      const { projetoId, userId, userRole } = input

      requireAdminOrProfessor(userRole)

      const projetoData = await repo.findProjetoWithRelations(parseInt(projetoId))

      if (!projetoData) {
        throw new NotFoundError('Projeto', 'não encontrado')
      }

      if (!isAdmin(userRole) && projetoData.professorResponsavelId !== userId) {
        throw new ForbiddenError('Você só pode gerar atas para seus próprios projetos')
      }

      const inscricoes = await repo.findInscricoesWithNotaFinal(parseInt(projetoId))

      const inscricoesBolsista = inscricoes.filter(
        (i) => i.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA && Number(i.notaFinal) >= 7.0
      )
      const inscricoesVoluntario = inscricoes.filter(
        (i) => i.tipoVagaPretendida === TIPO_INSCRICAO_VOLUNTARIO && Number(i.notaFinal) >= 7.0
      )

      const totalInscritos = await repo.findInscricoesByProjetoId(parseInt(projetoId))
      const disciplinas = await repo.findDisciplinasByProjetoId(parseInt(projetoId))

      log.info({ projetoId }, 'Ata data generated successfully')

      return {
        projeto: {
          ...projetoData,
          disciplinas: disciplinas.map((d) => d.disciplina),
        },
        totalInscritos: totalInscritos.length,
        totalCompareceram: inscricoes.length,
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

      if (ata.projeto.professorResponsavelId !== userId) {
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

      if (!isAdmin(userRole) && projetoData.professorResponsavelId !== userId) {
        throw new ForbiddenError('Você só pode publicar resultados para seus próprios projetos')
      }

      const inscricoes = await repo.findInscricoesByProjetoId(parseInt(projetoId))

      try {
        await db.transaction(async (tx) => {
          const txRepo = createSelecaoRepository(tx as unknown as Database)
          await Promise.all(
            inscricoes.map((inscricao) => {
              const aprovado = inscricao.notaFinal && Number(inscricao.notaFinal) >= 7.0
              const status = aprovado
                ? inscricao.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA
                  ? STATUS_INSCRICAO_SELECTED_BOLSISTA
                  : STATUS_INSCRICAO_SELECTED_VOLUNTARIO
                : STATUS_INSCRICAO_REJECTED_BY_PROFESSOR
              return txRepo.updateInscricaoStatus(inscricao.id, status)
            })
          )
        })
      } catch (error) {
        log.error({ error, projetoId }, 'Error updating inscription status')
        throw new BusinessError('Falha ao atualizar o status das inscrições no banco de dados.', 'INTERNAL_ERROR')
      }

      if (notifyStudents && inscricoes.length > 0) {
        const emailPromises = inscricoes.map(async (inscricaoItem) => {
          const aprovado = inscricaoItem.notaFinal && Number(inscricaoItem.notaFinal) >= 7.0
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
              feedbackProfessor: mensagemPersonalizada,
              projetoId: parseInt(projetoId),
              alunoId: inscricaoItem.alunoId,
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
            inscricao.status?.startsWith('SELECTED_') ||
            inscricao.status?.startsWith('REJECTED_')
        ),
      }))
    },

    async selectMonitors(input: SelectMonitorsInput) {
      const { projetoId, bolsistas, voluntarios, userId, userRole } = input

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

      await db.transaction(async (tx) => {
        const txRepo = createSelecaoRepository(tx as unknown as Database)

        // Reset all inscricoes
        await txRepo.resetInscricoes(projetoId)

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

        // Set rejected for unselected
        const allSelected = [...bolsistas, ...voluntarios]
        if (allSelected.length > 0) {
          const allInscricoes = await txRepo.getAllInscricaoIdsByProjetoId(projetoId)

          const unselected = allInscricoes
            .filter((inscricao) => !allSelected.includes(inscricao.id))
            .map((inscricao) => inscricao.id)

          if (unselected.length > 0) {
            await Promise.all(
              unselected.map((inscricaoId) => txRepo.updateInscricaoStatus(inscricaoId, 'REJECTED_BY_PROFESSOR'))
            )
          }
        }
      })

      log.info(
        { projetoId, bolsistas: bolsistas.length, voluntarios: voluntarios.length },
        'Monitors selected successfully'
      )

      return {
        success: true,
        message: 'Monitores selecionados com sucesso',
        bolsistasSelecionados: bolsistas.length,
        voluntariosSelecionados: voluntarios.length,
      }
    },

    async getAtasForSigning(userId: number, userRole: UserRole) {
      requireProfessor(userRole)

      const atas = await repo.findAtasByProfessorId(userId)
      const atasFiltradas = atas.filter((ata) => ata.projeto.professorResponsavel.userId === userId)

      return atasFiltradas
    },
  }
}
