import type { db } from '@/server/db'
import { createScholarshipAllocationRepository } from './scholarship-allocation-repository'
import { projetoEmailService } from '@/server/lib/email/projeto-emails'
import type { Semestre } from '@/types'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'ScholarshipAllocationNotifier' })

type Database = typeof db

export function createScholarshipAllocationNotifier(db: Database) {
  const repo = createScholarshipAllocationRepository(db)

  return {
    async notifyProfessorsAfterAllocation(ano: number, semestre: Semestre) {
      const projetos = await repo.getProjectsWithProfessors(ano, semestre)

      let emailsEnviados = 0
      const erros: string[] = []

      const professoresMap = new Map<
        number,
        {
          nome: string
          email: string
          projetos: { titulo: string; bolsas: number; voluntarios: number }[]
        }
      >()

      for (const projeto of projetos) {
        if (!projeto.professorEmail) {
          erros.push(`Professor sem e-mail cadastrado para o projeto ${projeto.titulo}`)
          continue
        }

        const profId = projeto.professorId
        if (!professoresMap.has(profId)) {
          professoresMap.set(profId, {
            nome: projeto.professorNome,
            email: projeto.professorEmail || '',
            projetos: [],
          })
        }

        professoresMap.get(profId)?.projetos.push({
          titulo: projeto.titulo,
          bolsas: projeto.bolsasDisponibilizadas || 0,
          voluntarios: projeto.voluntariosSolicitados || 0,
        })
      }

      for (const [profId, data] of professoresMap.entries()) {
        try {
          if (!data.email) {
            erros.push(`Professor ${data.nome} sem e-mail válido.`)
            continue
          }

          await projetoEmailService.sendScholarshipAllocation({
            to: data.email,
            professorName: data.nome,
            ano,
            semestre,
            projetos: data.projetos,
          })

          emailsEnviados++
          log.info({ professorId: profId, email: data.email }, 'Email de alocação enviado')
        } catch (error) {
          log.error({ error, professorId: profId }, 'Erro ao enviar email de alocação')
          erros.push(`Erro ao enviar email para ${data.email}`)
        }
      }

      log.info({ totalEmails: emailsEnviados, erros: erros.length }, 'Notificação de alocação de bolsas finalizada')

      return {
        success: true,
        emailsEnviados,
        professoresNotificados: professoresMap.size,
        erros,
      }
    },
  }
}

export type ScholarshipAllocationNotifier = ReturnType<typeof createScholarshipAllocationNotifier>
