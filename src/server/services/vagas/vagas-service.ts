import type { db } from '@/server/db'
import { createVagasRepository } from './vagas-repository'
import { emailService } from '@/server/lib/email'
import { logger } from '@/utils/logger'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  BOLSISTA,
  REJECTED_BY_STUDENT,
  TIPO_ASSINATURA_ATA_SELECAO,
  TIPO_ASSINATURA_TERMO_COMPROMISSO,
  VOLUNTARIO,
  VAGA_STATUS_ATIVA,
  VAGA_STATUS_ATIVO,
  VAGA_STATUS_INCOMPLETO,
  VAGA_STATUS_PENDENTE_ASSINATURA,
  type UserRole,
  type Semestre,
  type TipoVaga,
  type VagaStatus,
} from '@/types'
import { and, eq, sql } from 'drizzle-orm'
import { inscricaoTable, projetoTable, vagaTable } from '@/server/db/schema'
import { NotFoundError, ForbiddenError, BusinessError, ValidationError } from '@/server/lib/errors'
import { requireStudent, requireAdminOrProfessor, requireAdmin, isProfessor } from '@/server/lib/auth-helpers'

const log = logger.child({ context: 'VagasService' })

type Database = typeof db

export function createVagasService(db: Database) {
  const repo = createVagasRepository(db)

  return {
    async validateBolsaLimit(alunoId: string, ano: number, semestre: Semestre, tipoBolsa: TipoVaga) {
      if (tipoBolsa === VOLUNTARIO) {
        return { canAccept: true, reason: null }
      }

      const bolsaExistente = await repo.findBolsaExistente(parseInt(alunoId), ano, semestre, BOLSISTA)

      if (bolsaExistente) {
        return {
          canAccept: false,
          reason: `Você já possui uma bolsa de monitoria em ${bolsaExistente.projeto.titulo} para este semestre. É permitida apenas uma bolsa por semestre.`,
        }
      }

      return { canAccept: true, reason: null }
    },

    async acceptVaga(inscricaoId: string, tipoBolsa: TipoVaga, userId: number, userRole: UserRole) {
      requireStudent(userRole)

      const inscricaoData = await repo.findInscricaoById(parseInt(inscricaoId))

      if (!inscricaoData) {
        throw new NotFoundError('Inscricao', inscricaoId)
      }

      if (inscricaoData.aluno.userId !== userId) {
        throw new ForbiddenError('Você só pode aceitar suas próprias vagas')
      }

      const vagaExistente = await repo.findVagaByInscricaoId(parseInt(inscricaoId))

      if (vagaExistente) {
        throw new BusinessError('Vaga já foi aceita anteriormente', 'CONFLICT')
      }

      if (tipoBolsa === BOLSISTA) {
        const bolsaExistente = await repo.findBolsaExistente(
          inscricaoData.alunoId,
          inscricaoData.projeto.ano,
          inscricaoData.projeto.semestre,
          BOLSISTA
        )

        if (bolsaExistente) {
          throw new BusinessError(
            `Você já possui uma bolsa de monitoria em ${bolsaExistente.projeto.titulo} para este semestre. É permitida apenas uma bolsa por semestre.`,
            'CONFLICT'
          )
        }

        // Validar dados bancários para bolsistas
        const aluno = inscricaoData.aluno
        if (!aluno.banco || !aluno.agencia || !aluno.conta) {
          throw new ValidationError(
            'Dados bancários incompletos. Preencha banco, agência e conta antes de aceitar uma bolsa.'
          )
        }
      }

      const result = await db.transaction(async (tx) => {
        const [novaVaga] = await tx
          .insert(vagaTable)
          .values({
            alunoId: inscricaoData.alunoId,
            projetoId: inscricaoData.projetoId,
            inscricaoId: parseInt(inscricaoId),
            tipo: tipoBolsa,
            dataInicio: new Date(),
          })
          .returning()

        await tx
          .update(inscricaoTable)
          .set({
            status: tipoBolsa === BOLSISTA ? ACCEPTED_BOLSISTA : ACCEPTED_VOLUNTARIO,
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, parseInt(inscricaoId)))

        return novaVaga
      })

      try {
        await emailService.sendGenericEmail({
          to: inscricaoData.projeto.professorResponsavel.user.email,
          subject: `Vaga aceita - ${inscricaoData.aluno.user.username}`,
          html: `
Olá ${inscricaoData.projeto.professorResponsavel.nomeCompleto},<br><br>

O aluno ${inscricaoData.aluno.user.username} aceitou a vaga de ${tipoBolsa.toLowerCase()} para o projeto ${inscricaoData.projeto.titulo}.<br><br>

Dados do aluno:<br>
- Nome: ${inscricaoData.aluno.nomeCompleto}<br>
- Matrícula: ${inscricaoData.aluno.matricula}<br>
- E-mail: ${inscricaoData.aluno.user.email}<br><br>

Próximos passos: O termo de compromisso deve ser gerado e assinado por ambas as partes.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'VAGA_ACEITA',
          remetenteUserId: userId,
          projetoId: inscricaoData.projetoId,
          alunoId: inscricaoData.alunoId,
        })
      } catch (error) {
        log.error({ error }, 'Erro ao enviar notificação')
      }

      log.info({ vagaId: result.id, tipoBolsa }, 'Vaga aceita com sucesso')

      return {
        success: true,
        vagaId: result.id,
        message: `Vaga de ${tipoBolsa.toLowerCase()} aceita com sucesso!`,
      }
    },

    async rejectVaga(inscricaoId: string, motivo: string | undefined, userId: number, userRole: UserRole) {
      requireStudent(userRole)

      const inscricaoData = await repo.findInscricaoById(parseInt(inscricaoId))

      if (!inscricaoData) {
        throw new NotFoundError('Inscricao', inscricaoId)
      }

      if (inscricaoData.aluno.userId !== userId) {
        throw new ForbiddenError('Você só pode recusar suas próprias vagas')
      }

      await repo.updateInscricaoStatus(parseInt(inscricaoId), REJECTED_BY_STUDENT, motivo || 'Vaga recusada pelo aluno')

      try {
        await emailService.sendGenericEmail({
          to: inscricaoData.projeto.professorResponsavel.user.email,
          subject: `Vaga recusada - ${inscricaoData.aluno.user.username}`,
          html: `
Olá ${inscricaoData.projeto.professorResponsavel.nomeCompleto},<br><br>

O aluno ${inscricaoData.aluno.user.username} recusou a vaga oferecida para o projeto ${inscricaoData.projeto.titulo}.<br><br>

${motivo ? `Motivo informado: ${motivo}<br><br>` : ''}

Você pode oferecer a vaga para outro candidato da lista de espera.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'VAGA_RECUSADA',
          remetenteUserId: userId,
          projetoId: inscricaoData.projetoId,
          alunoId: inscricaoData.alunoId,
        })
      } catch (error) {
        log.error({ error }, 'Erro ao enviar notificação')
      }

      log.info({ inscricaoId }, 'Vaga recusada com sucesso')

      return {
        success: true,
        message: 'Vaga recusada com sucesso.',
      }
    },

    async getMyVagas(userId: number, userRole: UserRole) {
      requireStudent(userRole)

      const vagas = await repo.findVagasByAlunoUserId(userId)

      return vagas.map((vaga) => ({
        id: vaga.id,
        tipo: vaga.tipo,
        dataInicio: vaga.dataInicio,
        dataFim: vaga.dataFim,
        projeto: {
          id: vaga.projeto.id,
          titulo: vaga.projeto.titulo,
          ano: vaga.projeto.ano,
          semestre: vaga.projeto.semestre,
          departamento: vaga.projeto.departamento.nome,
          professor: vaga.projeto.professorResponsavel.nomeCompleto,
        },
        status: VAGA_STATUS_ATIVA,
      }))
    },

    async getVagasByProject(projetoId: string, userId: number, userRole: UserRole) {
      requireAdminOrProfessor(userRole)

      const projeto = await repo.findProjetoById(parseInt(projetoId))

      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (isProfessor(userRole) && projeto.professorResponsavelId !== userId) {
        throw new ForbiddenError('Você só pode ver vagas de seus próprios projetos')
      }

      const vagas = await repo.findVagasByProjetoId(parseInt(projetoId))

      return {
        projeto,
        vagas: vagas.map((vaga) => ({
          id: vaga.id,
          tipoBolsa: vaga.tipo,
          dataInicio: vaga.dataInicio,
          dataFim: vaga.dataFim,
          aluno: {
            id: vaga.aluno.id,
            nomeCompleto: vaga.aluno.nomeCompleto,
            matricula: vaga.aluno.matricula,
            cr: vaga.aluno.cr,
            user: {
              email: vaga.aluno.user.email,
              username: vaga.aluno.user.username,
            },
          },
          status: VAGA_STATUS_ATIVA,
        })),
      }
    },

    async statusVagasFinalizadas(
      filters: {
        ano?: number
        semestre?: Semestre
        projetoId?: string
      },
      userId: number,
      userRole: UserRole
    ) {
      const whereConditions = []

      if (filters.ano && filters.semestre) {
        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId}
              AND ${projetoTable.ano} = ${filters.ano} AND ${projetoTable.semestre} = ${filters.semestre})`
        )
      }

      if (filters.projetoId) {
        whereConditions.push(eq(vagaTable.projetoId, parseInt(filters.projetoId)))
      }

      if (isProfessor(userRole)) {
        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId}
              AND ${projetoTable.professorResponsavelId} = ${userId})`
        )
      }

      const vagas = await repo.findVagasWithFilters(whereConditions.length > 0 ? and(...whereConditions) : undefined)

      const vagasComStatus = await Promise.all(
        vagas.map(async (vaga) => {
          const assinaturas = await repo.findAssinaturasByVagaId(vaga.id)

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO)
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

          let statusFinal: VagaStatus = VAGA_STATUS_INCOMPLETO
          if (assinaturaAluno && assinaturaProfessor) {
            statusFinal = VAGA_STATUS_ATIVO
          } else if (assinaturaAluno || assinaturaProfessor) {
            statusFinal = VAGA_STATUS_PENDENTE_ASSINATURA
          }

          return {
            vagaId: vaga.id,
            monitor: {
              nome: vaga.aluno.nomeCompleto,
              matricula: vaga.aluno.matricula,
              email: vaga.aluno.user.email,
            },
            projeto: {
              id: vaga.projetoId,
              titulo: vaga.projeto.titulo,
              professor: vaga.projeto.professorResponsavel.nomeCompleto,
            },
            tipo: vaga.tipo,
            dataInicio: vaga.dataInicio,
            status: statusFinal,
            termo: {
              assinaturaAluno: !!assinaturaAluno,
              assinaturaProfessor: !!assinaturaProfessor,
              dataCompletude:
                assinaturaAluno && assinaturaProfessor
                  ? new Date(
                      Math.max(
                        new Date(assinaturaAluno.createdAt).getTime(),
                        new Date(assinaturaProfessor.createdAt).getTime()
                      )
                    )
                  : null,
            },
          }
        })
      )

      return {
        vagas: vagasComStatus,
        estatisticas: {
          total: vagasComStatus.length,
          ativas: vagasComStatus.filter((v) => v.status === VAGA_STATUS_ATIVO).length,
          pendentes: vagasComStatus.filter((v) => v.status === VAGA_STATUS_PENDENTE_ASSINATURA).length,
          incompletas: vagasComStatus.filter((v) => v.status === VAGA_STATUS_INCOMPLETO).length,
        },
      }
    },

    async finalizarMonitoria(vagaId: string, dataFim: Date | undefined, userId: number, userRole: UserRole) {
      requireAdmin(userRole)

      const vagaData = await repo.findVagaByIdWithRelations(parseInt(vagaId))

      if (!vagaData) {
        throw new NotFoundError('Vaga', vagaId)
      }

      const assinaturas = await repo.findAssinaturasByVagaId(parseInt(vagaId))

      const termoCompleto =
        assinaturas.some((a) => a.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO) &&
        assinaturas.some((a) => a.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO)

      if (!termoCompleto) {
        throw new BusinessError(
          'Não é possível finalizar monitoria sem termo assinado por ambas as partes',
          'BAD_REQUEST'
        )
      }

      const dataFimFinal = dataFim || new Date()

      await repo.updateVaga(parseInt(vagaId), {
        dataFim: dataFimFinal,
      })

      try {
        await emailService.sendGenericEmail({
          to: vagaData.aluno.user.email,
          subject: 'Monitoria Finalizada',
          html: `
Olá ${vagaData.aluno.user.username},<br><br>

Sua monitoria no projeto ${vagaData.projeto.titulo} foi oficialmente finalizada em ${dataFimFinal.toLocaleDateString('pt-BR')}.<br><br>

Obrigado pela sua participação no programa de monitoria!<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'MONITORIA_FINALIZADA',
          remetenteUserId: userId,
          projetoId: vagaData.projetoId,
          alunoId: vagaData.alunoId,
        })

        await emailService.sendGenericEmail({
          to: vagaData.projeto.professorResponsavel.user.email,
          subject: 'Monitoria Finalizada',
          html: `
Olá ${vagaData.projeto.professorResponsavel.nomeCompleto},<br><br>

A monitoria do aluno ${vagaData.aluno.user.username} no projeto ${vagaData.projeto.titulo} foi oficialmente finalizada em ${dataFimFinal.toLocaleDateString('pt-BR')}.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'MONITORIA_FINALIZADA',
          remetenteUserId: userId,
          projetoId: vagaData.projetoId,
        })
      } catch (error) {
        log.error({ error }, 'Erro ao enviar notificações de finalização')
      }

      log.info({ vagaId, dataFim: dataFimFinal }, 'Monitoria finalizada com sucesso')

      return {
        success: true,
        message: 'Monitoria finalizada com sucesso',
        dataFinalizacao: dataFimFinal,
      }
    },
  }
}

export type VagasService = ReturnType<typeof createVagasService>
