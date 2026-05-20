import { emailService } from '@/server/lib/email'
import { NotFoundError, ValidationError } from '@/server/lib/errors'
import { SEMESTRE_1 } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import type { EditalRepository } from './edital-repository'

const log = logger.child({ context: 'EditalPublicationService' })

export function createEditalPublicationService(
  repo: EditalRepository,
  validateEditalForPublication: (id: number) => Promise<unknown>
) {
  return {
    async validateEditalForPublication(id: number) {
      const edital = await repo.findByIdWithRelations(id)
      if (!edital) {
        throw new NotFoundError('Edital', id)
      }

      if (!edital.titulo || edital.titulo.trim() === '') {
        throw new ValidationError('O edital precisa ter um título antes de ser publicado.')
      }

      if (!edital.descricaoHtml || edital.descricaoHtml.trim() === '') {
        throw new ValidationError('O edital precisa ter uma descrição antes de ser publicado.')
      }

      if (!edital.fileIdAssinado) {
        throw new ValidationError('O edital precisa estar assinado antes de ser publicado.')
      }

      if (edital.periodoInscricao) {
        const projetosCount = await repo.countApprovedProjectsByPeriod(
          edital.periodoInscricao.ano,
          edital.periodoInscricao.semestre
        )

        if (projetosCount === 0) {
          throw new ValidationError('Não é possível publicar um edital sem projetos aprovados.')
        }
      }

      return edital
    },

    async publishEdital(id: number, adminUserId: number) {
      await validateEditalForPublication(id)

      const updated = await repo.update(id, {
        publicado: true,
        dataPublicacao: new Date(),
      })

      log.info({ editalId: id, adminUserId }, 'Edital publicado')
      return updated
    },

    async publishAndNotify(id: number, adminUserId: number, emailLists: string[]) {
      const edital = (await validateEditalForPublication(id)) as NonNullable<
        Awaited<ReturnType<typeof repo.findByIdWithRelations>>
      >

      const updatedEdital = await repo.update(id, {
        publicado: true,
        dataPublicacao: new Date(),
      })

      const semestreFormatado = edital.periodoInscricao?.semestre === SEMESTRE_1 ? '1º Semestre' : '2º Semestre'
      const linkPDF = `${env.CLIENT_URL}/api/editais/${id}/pdf`

      let emailsSent = 0
      try {
        await emailService.sendEditalPublishedNotification({
          editalNumero: edital.numeroEdital,
          editalTitulo: edital.titulo,
          semestreFormatado,
          ano: edital.periodoInscricao?.ano || new Date().getFullYear(),
          linkPDF,
          to: emailLists,
        })
        emailsSent = emailLists.length
        log.info({ editalId: id, adminUserId, emailsSent }, 'Edital publicado e emails enviados')
      } catch (emailError) {
        log.error({ error: emailError, editalId: id }, 'Erro ao enviar emails de notificação')
      }

      return { edital: updatedEdital, emailsSent }
    },
  }
}

export type EditalPublicationService = ReturnType<typeof createEditalPublicationService>
