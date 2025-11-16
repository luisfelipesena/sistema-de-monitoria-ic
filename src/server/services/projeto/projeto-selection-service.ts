import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { emailService } from '@/server/lib/email'
import { ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO, type UserRole } from '@/types'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoSelectionService' })

export function createProjetoSelectionService(repo: ProjetoRepository) {
  return {
    async generateSelectionMinutesData(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithRelations(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      const disciplinas = await repo.findDisciplinasByProjetoId(projeto.id)
      const candidatos = await repo.findInscricoesByProjetoId(projeto.id)

      const ataInfo = {
        dataSelecao: new Date().toLocaleDateString('pt-BR'),
        localSelecao: null,
        observacoes: null,
      }

      const candidatosTransformados = candidatos.map((candidato) => ({
        id: candidato.id,
        aluno: {
          nomeCompleto: candidato.aluno.nomeCompleto,
          matricula: candidato.aluno.matricula,
          cr: candidato.aluno.cr,
        },
        tipoVagaPretendida: candidato.tipoVagaPretendida,
        notaDisciplina: candidato.notaDisciplina ? Number(candidato.notaDisciplina) : null,
        notaSelecao: candidato.notaSelecao ? Number(candidato.notaSelecao) : null,
        coeficienteRendimento: candidato.coeficienteRendimento ? Number(candidato.coeficienteRendimento) : null,
        notaFinal: candidato.notaFinal ? Number(candidato.notaFinal) : null,
        status: candidato.status,
        observacoes: candidato.observacoes,
      }))

      return {
        projeto: {
          id: projeto.id,
          titulo: projeto.titulo,
          ano: projeto.ano,
          semestre: projeto.semestre,
          departamento: {
            nome: projeto.departamento.nome,
            sigla: projeto.departamento.sigla,
          },
          professorResponsavel: {
            nomeCompleto: projeto.professorResponsavel.nomeCompleto,
            matriculaSiape: projeto.professorResponsavel.matriculaSiape,
          },
          disciplinas,
        },
        candidatos: candidatosTransformados,
        ataInfo,
      }
    },

    async saveSelectionMinutes(projetoId: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      const ataExistente = await repo.findAtaByProjetoId(projetoId)
      let ataId: number

      if (ataExistente) {
        await repo.updateAta(ataExistente.id)
        ataId = ataExistente.id
      } else {
        const novaAta = await repo.insertAta(projetoId, userId)
        ataId = novaAta.id
      }

      log.info({ projetoId, ataId }, 'Ata de seleção salva')
      return ataId
    },

    async notifySelectionResults(
      projetoId: number,
      mensagemPersonalizada: string | undefined,
      userId: number,
      userRole: UserRole
    ) {
      const projeto = await repo.findByIdWithRelations(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      const candidatos = await repo.findInscricoesWithUserByProjetoId(projetoId)
      let notificationsCount = 0

      for (const candidato of candidatos) {
        try {
          let status: typeof SELECTED_BOLSISTA | typeof SELECTED_VOLUNTARIO | typeof REJECTED_BY_PROFESSOR

          if (candidato.inscricao.status === SELECTED_BOLSISTA) {
            status = SELECTED_BOLSISTA
          } else if (candidato.inscricao.status === SELECTED_VOLUNTARIO) {
            status = SELECTED_VOLUNTARIO
          } else {
            status = REJECTED_BY_PROFESSOR
          }

          await emailService.sendStudentSelectionResultNotification(
            {
              studentName: candidato.aluno.nomeCompleto,
              studentEmail: candidato.user.email,
              projectTitle: projeto.titulo,
              professorName: projeto.professorResponsavel.nomeCompleto,
              status,
              feedbackProfessor: candidato.inscricao.feedbackProfessor || mensagemPersonalizada,
              alunoId: candidato.aluno.id,
              projetoId: projeto.id,
            },
            userId
          )

          notificationsCount++
        } catch (emailError) {
          log.error(
            {
              error: emailError,
              candidatoId: candidato.aluno.id,
              projetoId,
            },
            'Erro ao enviar notificação para candidato'
          )
        }
      }

      log.info(
        {
          projetoId,
          notificationsCount,
          totalCandidatos: candidatos.length,
        },
        'Notificações de resultado enviadas'
      )

      return notificationsCount
    },
  }
}

export type ProjetoSelectionService = ReturnType<typeof createProjetoSelectionService>
