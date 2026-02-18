import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { emailService } from '@/server/lib/email'
import { BusinessError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { PDFService } from '@/server/lib/pdf-service'
import {
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_PENDING_REVISION,
  PROJETO_STATUS_PENDING_SIGNATURE,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
  type UserRole,
} from '@/types'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoApprovalService' })

export function createProjetoApprovalService(repo: ProjetoRepository) {
  return {
    async submitProjeto(id: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findById(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      if (
        projeto.status !== PROJETO_STATUS_DRAFT &&
        projeto.status !== PROJETO_STATUS_PENDING_SIGNATURE &&
        projeto.status !== PROJETO_STATUS_PENDING_REVISION
      ) {
        throw new BusinessError('Projeto não pode ser submetido neste status', 'BAD_REQUEST')
      }

      await repo.update(id, { status: PROJETO_STATUS_SUBMITTED })
      log.info({ projetoId: id }, 'Projeto submetido para aprovação')
    },

    async approveProjeto(id: number, bolsasDisponibilizadas?: number, feedbackAdmin?: string) {
      const projeto = await repo.findById(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (projeto.status !== PROJETO_STATUS_SUBMITTED) {
        throw new BusinessError('Projeto não está aguardando aprovação', 'BAD_REQUEST')
      }

      await repo.update(id, {
        status: PROJETO_STATUS_APPROVED,
        bolsasDisponibilizadas,
        feedbackAdmin,
      })

      log.info({ projetoId: id }, 'Projeto aprovado pelo admin')
    },

    async rejectProjeto(id: number, feedbackAdmin: string) {
      const projeto = await repo.findById(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (projeto.status !== PROJETO_STATUS_SUBMITTED) {
        throw new BusinessError('Projeto não está aguardando aprovação', 'BAD_REQUEST')
      }

      await repo.update(id, {
        status: PROJETO_STATUS_REJECTED,
        feedbackAdmin,
      })

      log.info({ projetoId: id }, 'Projeto rejeitado')
    },

    async requestRevision(id: number, mensagem: string, userId: number) {
      const projeto = await repo.findByIdWithRelations(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (projeto.status !== PROJETO_STATUS_SUBMITTED) {
        throw new BusinessError('Projeto não está aguardando aprovação', 'BAD_REQUEST')
      }

      // Update project: clear signature, set revision status and message
      await repo.update(id, {
        status: PROJETO_STATUS_PENDING_REVISION,
        mensagemRevisao: mensagem,
        revisaoSolicitadaEm: new Date(),
        assinaturaProfessor: null, // Clear signature - professor must re-sign after edits
      })

      log.info({ projetoId: id }, 'Revisão solicitada pelo admin')

      // Send email notification to professor
      try {
        const professor = projeto.professorResponsavel
        if (professor?.emailInstitucional) {
          await emailService.sendProjetoStatusChangeNotification(
            {
              professorNome: professor.nomeCompleto,
              professorEmail: professor.emailInstitucional,
              projetoTitulo: projeto.titulo,
              projetoId: projeto.id,
              novoStatus: PROJETO_STATUS_PENDING_REVISION,
              feedback: mensagem,
              linkProjeto: `${process.env.NEXT_PUBLIC_APP_URL}/home/professor/projetos/${projeto.id}/edit`,
            },
            userId
          )
          log.info(
            { projetoId: id, professorEmail: professor.emailInstitucional },
            'Email de revisão enviado ao professor'
          )
        }
      } catch (error) {
        log.error({ error, projetoId: id }, 'Erro ao enviar email de revisão, mas status foi atualizado')
      }
    },

    async signProfessor(projetoId: number, signatureImage: string, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithRelations(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || professor.id !== projeto.professorResponsavelId) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      await repo.update(projetoId, {
        assinaturaProfessor: signatureImage,
        status: PROJETO_STATUS_SUBMITTED,
      })

      // Generate and save PDF
      const [disciplinas, atividades] = await Promise.all([
        repo.findDisciplinasByProjetoId(projeto.id),
        repo.findAtividadesByProjetoId(projeto.id),
      ])

      const periodo = await repo.findPeriodoByProjetoSemestre(projeto.ano, projeto.semestre)
      const numeroEdital = periodo?.numeroEditalPrograd || periodo?.edital?.numeroEdital

      const pdfData = {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        departamento: projeto.departamento ?? undefined,
        professorResponsavel: projeto.professorResponsavel,
        ano: projeto.ano,
        semestre: projeto.semestre,
        numeroEdital,
        tipoProposicao: projeto.tipoProposicao,
        bolsasSolicitadas: projeto.bolsasSolicitadas,
        voluntariosSolicitados: projeto.voluntariosSolicitados,
        cargaHorariaSemana: projeto.cargaHorariaSemana,
        numeroSemanas: projeto.numeroSemanas,
        publicoAlvo: projeto.publicoAlvo,
        estimativaPessoasBenificiadas: projeto.estimativaPessoasBenificiadas || undefined,
        disciplinas,
        professoresParticipantes: projeto.professoresParticipantes || '',
        atividades: atividades.map((a) => a.descricao),
        assinaturaProfessor: signatureImage,
        dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
        signingMode: 'professor' as const,
        projetoId: projeto.id,
      }

      try {
        const objectName = await PDFService.generateAndSaveSignedProjetoPDF(pdfData, signatureImage)
        log.info({ projetoId, objectName }, 'PDF com assinatura do professor salvo no MinIO')

        const savedPdf = await PDFService.getLatestProjetoPDF(projeto.id)
        if (!savedPdf) {
          log.error({ projetoId }, 'PDF não foi encontrado após ser salvo - possível problema de sincronização')
        } else {
          log.info({ projetoId, objectName: savedPdf.objectName }, 'PDF verificado e encontrado após salvamento')
        }
      } catch (error) {
        log.error({ projetoId, error }, 'ERRO CRÍTICO: Falha ao gerar/salvar PDF no MinIO após assinatura do professor')
        throw new BusinessError('Falha ao gerar PDF após assinatura. Tente novamente.', 'INTERNAL_ERROR')
      }

      // Send notifications to admins
      try {
        const admins = await repo.findAdmins()
        if (admins.length > 0) {
          const adminEmails = admins.map((admin) => admin.email)
          await emailService.sendProfessorAssinouPropostaNotification(
            {
              professorNome: projeto.professorResponsavel.nomeCompleto,
              projetoTitulo: projeto.titulo,
              projetoId: projeto.id,
              novoStatusProjeto: PROJETO_STATUS_SUBMITTED,
              remetenteUserId: userId,
            },
            adminEmails
          )
          log.info({ projetoId, adminCount: adminEmails.length }, 'Notificações enviadas para admins')
        }
      } catch (error) {
        log.error({ error, projetoId }, 'Erro ao enviar notificações, mas assinatura foi salva')
      }

      log.info(
        {
          projetoId,
          projetoTitulo: projeto.titulo,
          professorResponsavelId: projeto.professorResponsavelId,
          userId,
          userRole,
          timestamp: new Date().toISOString(),
        },
        'Assinatura do professor adicionada - projeto UNICO assinado'
      )
    },
  }
}

export type ProjetoApprovalService = ReturnType<typeof createProjetoApprovalService>
