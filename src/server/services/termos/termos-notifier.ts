import type { db } from '@/server/db'
import { emailSender } from '@/server/lib/email/email-sender'
import { ForbiddenError } from '@/server/lib/errors'
import type { UserRole } from '@/types'
import { ADMIN, PROFESSOR, TIPO_ASSINATURA_ATA_SELECAO, TIPO_ASSINATURA_TERMO_COMPROMISSO } from '@/types'
import { logger } from '@/utils/logger'
import { createTermosRepository } from './termos-repository'

const log = logger.child({ context: 'TermosNotifier' })

type Database = typeof db

export function createTermosNotifier(db: Database) {
  const repo = createTermosRepository(db)

  return {
    async notifyPendingSignatures(
      vagaId: number | undefined,
      projetoId: number | undefined,
      remetenteUserId: number,
      userRole: UserRole
    ) {
      if (userRole !== ADMIN && userRole !== PROFESSOR) {
        throw new ForbiddenError('Apenas admins e professores podem notificar pendências')
      }

      type VagaType = Awaited<ReturnType<typeof repo.findVagasByProjetoId>>[number]
      let vagas: VagaType[] = []

      if (vagaId) {
        const vaga = await repo.findVagaSimple(vagaId)
        if (vaga) vagas = [vaga]
      } else if (projetoId) {
        vagas = await repo.findVagasByProjetoId(projetoId)
      }

      let notificacoesEnviadas = 0

      for (const vaga of vagas) {
        const assinaturas = await repo.findSignaturesByVagaId(vaga.id)

        const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
        const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

        if (!assinaturaAluno) {
          try {
            await emailSender.send({
              to: vaga.aluno.user.email,
              subject: 'Lembrete: Assinatura de Termo de Compromisso Pendente',
              html: `
Olá ${vaga.aluno.user.username},<br><br>

Você tem um termo de compromisso pendente de assinatura para a monitoria do projeto ${vaga.projeto.titulo}.<br><br>

Acesse o sistema para assinar digitalmente: <a href="/student/termos-compromisso">Assinar Termo</a><br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
              `,
              tipoNotificacao: 'TERMO_PENDENTE',
              remetenteUserId,
              projetoId: vaga.projetoId,
              alunoId: vaga.alunoId,
            })
            notificacoesEnviadas++
          } catch (error) {
            log.error({ error, vagaId: vaga.id }, 'Erro ao notificar aluno')
          }
        }

        if (!assinaturaProfessor) {
          try {
            await emailSender.send({
              to: vaga.projeto.professorResponsavel.user.email,
              subject: 'Lembrete: Assinatura de Termo de Compromisso Pendente',
              html: `
Olá ${vaga.projeto.professorResponsavel.nomeCompleto},<br><br>

Você tem um termo de compromisso pendente de assinatura para o aluno ${vaga.aluno.user.username} do projeto ${vaga.projeto.titulo}.<br><br>

Acesse o sistema para assinar digitalmente: <a href="/professor/termos-compromisso">Assinar Termo</a><br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
              `,
              tipoNotificacao: 'TERMO_PENDENTE',
              remetenteUserId,
              projetoId: vaga.projetoId,
            })
            notificacoesEnviadas++
          } catch (error) {
            log.error({ error, vagaId: vaga.id }, 'Erro ao notificar professor')
          }
        }
      }

      log.info({ notificacoesEnviadas }, 'Notificações de termos pendentes enviadas')

      return {
        success: true,
        notificacoesEnviadas,
        message: `${notificacoesEnviadas} notificações enviadas com sucesso`,
      }
    },
  }
}

export type TermosNotifier = ReturnType<typeof createTermosNotifier>
