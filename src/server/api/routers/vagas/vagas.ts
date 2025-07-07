import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { alunoTable, assinaturaDocumentoTable, inscricaoTable, projetoTable, vagaTable } from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { semestreSchema, tipoVagaSchema, STATUS_INSCRICAO_ENUM } from '@/types'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export const vagasRouter = createTRPCRouter({
  // Validar se aluno pode aceitar bolsa (limite de 1 por semestre)
  validateBolsaLimit: protectedProcedure
    .input(
      z.object({
        alunoId: z.string(),
        ano: z.number(),
        semestre: semestreSchema,
        tipoBolsa: tipoVagaSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      // Se for voluntário, sempre pode aceitar múltiplas
      if (input.tipoBolsa === 'VOLUNTARIO') {
        return { canAccept: true, reason: null }
      }

      // Verificar se já tem bolsa no semestre
      const bolsaExistente = await ctx.db.query.vagaTable.findFirst({
        where: and(
          eq(vagaTable.alunoId, parseInt(input.alunoId)),
          eq(vagaTable.tipo, 'BOLSISTA'),
          sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId} 
              AND ${projetoTable.ano} = ${input.ano} AND ${projetoTable.semestre} = ${input.semestre})`
        ),
        with: {
          projeto: true,
        },
      })

      if (bolsaExistente) {
        return {
          canAccept: false,
          reason: `Você já possui uma bolsa de monitoria em ${bolsaExistente.projeto.titulo} para este semestre. É permitida apenas uma bolsa por semestre.`,
        }
      }

      return { canAccept: true, reason: null }
    }),

  // Aceitar vaga ofertada (criar registro na tabela vaga)
  acceptVaga: protectedProcedure
    .input(
      z.object({
        inscricaoId: z.string(),
        tipoBolsa: tipoVagaSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas alunos podem aceitar vagas',
        })
      }

      // Buscar inscrição
      const inscricaoData = await ctx.db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, parseInt(input.inscricaoId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })

      if (!inscricaoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      // Verificar se é o aluno da inscrição
      if (inscricaoData.aluno.userId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode aceitar suas próprias vagas',
        })
      }

      // Verificar se já aceitou
      const vagaExistente = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.inscricaoId, parseInt(input.inscricaoId)),
      })

      if (vagaExistente) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vaga já foi aceita anteriormente',
        })
      }

      // Verificar limite de bolsas se for bolsista
      if (input.tipoBolsa === 'BOLSISTA') {
        // Verificar se já tem bolsa no semestre
        const bolsaExistente = await ctx.db.query.vagaTable.findFirst({
          where: and(
            eq(vagaTable.alunoId, inscricaoData.alunoId),
            eq(vagaTable.tipo, 'BOLSISTA'),
            sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId} 
                AND ${projetoTable.ano} = ${inscricaoData.projeto.ano} AND ${projetoTable.semestre} = ${inscricaoData.projeto.semestre})`
          ),
          with: {
            projeto: true,
          },
        })

        if (bolsaExistente) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Você já possui uma bolsa de monitoria em ${bolsaExistente.projeto.titulo} para este semestre. É permitida apenas uma bolsa por semestre.`,
          })
        }
      }

      // Executar em transação
      const result = await ctx.db.transaction(async (tx) => {
        // Criar vaga
        const [novaVaga] = await tx
          .insert(vagaTable)
          .values({
            alunoId: inscricaoData.alunoId,
            projetoId: inscricaoData.projetoId,
            inscricaoId: parseInt(input.inscricaoId),
            tipo: input.tipoBolsa,
            dataInicio: new Date(), // Definir data de início padrão
          })
          .returning()

        // Atualizar status da inscrição
        await tx
          .update(inscricaoTable)
          .set({
            status: input.tipoBolsa === 'BOLSISTA' ? STATUS_INSCRICAO_ENUM[3] : STATUS_INSCRICAO_ENUM[4], // 'ACCEPTED_BOLSISTA' : 'ACCEPTED_VOLUNTARIO'
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, parseInt(input.inscricaoId)))

        return novaVaga
      })

      // Enviar notificação para o professor
      try {
        await emailService.sendGenericEmail({
          to: inscricaoData.projeto.professorResponsavel.user.email,
          subject: `Vaga aceita - ${inscricaoData.aluno.user.username}`,
          html: `
Olá ${inscricaoData.projeto.professorResponsavel.user.username},<br><br>

O aluno ${inscricaoData.aluno.user.username} aceitou a vaga de ${input.tipoBolsa.toLowerCase()} para o projeto ${inscricaoData.projeto.titulo}.<br><br>

Dados do aluno:<br>
- Nome: ${inscricaoData.aluno.nomeCompleto}<br>
- Matrícula: ${inscricaoData.aluno.matricula}<br>
- E-mail: ${inscricaoData.aluno.user.email}<br><br>

Próximos passos: O termo de compromisso deve ser gerado e assinado por ambas as partes.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'VAGA_ACEITA',
          remetenteUserId: user.id,
          projetoId: inscricaoData.projetoId,
          alunoId: inscricaoData.alunoId,
        })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
      }

      return {
        success: true,
        vagaId: result.id,
        message: `Vaga de ${input.tipoBolsa.toLowerCase()} aceita com sucesso!`,
      }
    }),

  // Recusar vaga ofertada
  rejectVaga: protectedProcedure
    .input(
      z.object({
        inscricaoId: z.string(),
        motivo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas alunos podem recusar vagas',
        })
      }

      // Buscar inscrição
      const inscricaoData = await ctx.db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, parseInt(input.inscricaoId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })

      if (!inscricaoData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      // Verificar se é o aluno da inscrição
      if (inscricaoData.aluno.userId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode recusar suas próprias vagas',
        })
      }

      // Atualizar status da inscrição
      await ctx.db
        .update(inscricaoTable)
        .set({
          status: STATUS_INSCRICAO_ENUM[6], // 'REJECTED_BY_STUDENT'
          feedbackProfessor: input.motivo || 'Vaga recusada pelo aluno',
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, parseInt(input.inscricaoId)))

      // Enviar notificação para o professor
      try {
        await emailService.sendGenericEmail({
          to: inscricaoData.projeto.professorResponsavel.user.email,
          subject: `Vaga recusada - ${inscricaoData.aluno.user.username}`,
          html: `
Olá ${inscricaoData.projeto.professorResponsavel.user.username},<br><br>

O aluno ${inscricaoData.aluno.user.username} recusou a vaga oferecida para o projeto ${inscricaoData.projeto.titulo}.<br><br>

${input.motivo ? `Motivo informado: ${input.motivo}<br><br>` : ''}

Você pode oferecer a vaga para outro candidato da lista de espera.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'VAGA_RECUSADA',
          remetenteUserId: user.id,
          projetoId: inscricaoData.projetoId,
          alunoId: inscricaoData.alunoId,
        })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
      }

      return {
        success: true,
        message: 'Vaga recusada com sucesso.',
      }
    }),

  // Buscar vagas do aluno logado
  getMyVagas: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx

    if (user.role !== 'student') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Apenas alunos podem ver suas vagas',
      })
    }

    // Buscar vagas do aluno
    const vagas = await ctx.db.query.vagaTable.findMany({
      where: sql`${vagaTable.alunoId} IN (
          SELECT id FROM ${alunoTable} WHERE ${alunoTable.userId} = ${user.id}
        )`,
      with: {
        projeto: {
          with: {
            departamento: true,
            professorResponsavel: {
              with: { user: true },
            },
          },
        },
        aluno: {
          with: { user: true },
        },
      },
      orderBy: [desc(vagaTable.createdAt)],
    })

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
      status: 'ATIVA', // Por enquanto todas são ativas
    }))
  }),

  // Buscar vagas por projeto (para professores)
  getVagasByProject: protectedProcedure
    .input(
      z.object({
        projetoId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      if (!['professor', 'admin'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas professores e admins podem ver vagas de projetos',
        })
      }

      // Buscar projeto para verificar permissões
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, parseInt(input.projetoId)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      // Verificar se é o professor responsável (se não for admin)
      if (user.role === 'professor' && projeto.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Você só pode ver vagas de seus próprios projetos',
        })
      }

      // Buscar vagas do projeto
      const vagas = await ctx.db.query.vagaTable.findMany({
        where: eq(vagaTable.projetoId, parseInt(input.projetoId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: true,
        },
        orderBy: [desc(vagaTable.createdAt)],
      })

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
          status: 'ATIVA', // Por enquanto todas são ativas
        })),
      }
    }),

  // Relatório de status das vagas finalizadas
  statusVagasFinalizadas: protectedProcedure
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: semestreSchema.optional(),
        projetoId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      // Construir condições de busca
      const whereConditions = []

      if (input.ano && input.semestre) {
        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId} 
              AND ${projetoTable.ano} = ${input.ano} AND ${projetoTable.semestre} = ${input.semestre})`
        )
      }

      if (input.projetoId) {
        whereConditions.push(eq(vagaTable.projetoId, parseInt(input.projetoId)))
      }

      // Filtrar por permissões do usuário
      if (user.role === 'professor') {
        whereConditions.push(
          sql`EXISTS (SELECT 1 FROM ${projetoTable} WHERE ${projetoTable.id} = ${vagaTable.projetoId} 
              AND ${projetoTable.professorResponsavelId} = ${user.id})`
        )
      }

      const vagas = await ctx.db.query.vagaTable.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })

      // Para cada vaga, verificar status completo
      const vagasComStatus = await Promise.all(
        vagas.map(async (vaga) => {
          // Verificar assinaturas do termo
          const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, vaga.id),
          })

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO')
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

          let statusFinal = 'INCOMPLETO'
          if (assinaturaAluno && assinaturaProfessor) {
            statusFinal = 'ATIVO'
          } else if (assinaturaAluno || assinaturaProfessor) {
            statusFinal = 'PENDENTE_ASSINATURA'
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
          ativas: vagasComStatus.filter((v) => v.status === 'ATIVO').length,
          pendentes: vagasComStatus.filter((v) => v.status === 'PENDENTE_ASSINATURA').length,
          incompletas: vagasComStatus.filter((v) => v.status === 'INCOMPLETO').length,
        },
      }
    }),

  // Finalizar processo de monitoria (para admins)
  finalizarMonitoria: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
        dataFim: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem finalizar monitorias',
        })
      }

      const vagaData = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })

      if (!vagaData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vaga não encontrada',
        })
      }

      // Verificar se termo está assinado
      const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
        where: eq(assinaturaDocumentoTable.vagaId, parseInt(input.vagaId)),
      })

      const termoCompleto =
        assinaturas.some((a) => a.tipoAssinatura === 'TERMO_COMPROMISSO_ALUNO') &&
        assinaturas.some((a) => a.tipoAssinatura === 'ATA_SELECAO_PROFESSOR')

      if (!termoCompleto) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível finalizar monitoria sem termo assinado por ambas as partes',
        })
      }

      // Atualizar vaga com data de fim
      const dataFimFinal = input.dataFim || new Date()

      await ctx.db
        .update(vagaTable)
        .set({
          dataFim: dataFimFinal,
          updatedAt: new Date(),
        })
        .where(eq(vagaTable.id, parseInt(input.vagaId)))

      // Enviar notificações de finalização
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
          remetenteUserId: user.id,
          projetoId: vagaData.projetoId,
          alunoId: vagaData.alunoId,
        })

        await emailService.sendGenericEmail({
          to: vagaData.projeto.professorResponsavel.user.email,
          subject: 'Monitoria Finalizada',
          html: `
Olá ${vagaData.projeto.professorResponsavel.user.username},<br><br>

A monitoria do aluno ${vagaData.aluno.user.username} no projeto ${vagaData.projeto.titulo} foi oficialmente finalizada em ${dataFimFinal.toLocaleDateString('pt-BR')}.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
          `,
          tipoNotificacao: 'MONITORIA_FINALIZADA',
          remetenteUserId: user.id,
          projetoId: vagaData.projetoId,
        })
      } catch (error) {
        console.error('Erro ao enviar notificações de finalização:', error)
      }

      return {
        success: true,
        message: 'Monitoria finalizada com sucesso',
        dataFinalizacao: dataFimFinal,
      }
    }),
})
