import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import { 
  vagaTable, 
  inscricaoTable, 
  projetoTable, 
  alunoTable,
  userTable
} from '@/server/db/schema'
import { z } from 'zod'
import { eq, and, desc, isNotNull, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { emailService } from '@/server/lib/email-service'

export const vagasRouter = createTRPCRouter({
  // Validar se aluno pode aceitar bolsa (limite de 1 por semestre)
  validateBolsaLimit: protectedProcedure
    .input(
      z.object({
        alunoId: z.string(),
        ano: z.number(),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
        tipoBolsa: z.enum(['BOLSISTA', 'VOLUNTARIO']),
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
          projeto: true
        }
      })

      if (bolsaExistente) {
        return { 
          canAccept: false,
          reason: `Você já possui uma bolsa de monitoria em ${bolsaExistente.projeto.titulo} para este semestre. É permitida apenas uma bolsa por semestre.`
        }
      }

      return { canAccept: true, reason: null }
    }),

  // Aceitar vaga ofertada (criar registro na tabela vaga)
  acceptVaga: protectedProcedure
    .input(
      z.object({
        inscricaoId: z.string(),
        tipoBolsa: z.enum(['BOLSISTA', 'VOLUNTARIO']),
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
            with: { user: true }
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true }
              }
            }
          }
        }
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
        where: eq(vagaTable.inscricaoId, parseInt(input.inscricaoId))
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
            projeto: true
          }
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
        const [novaVaga] = await tx.insert(vagaTable).values({
          alunoId: inscricaoData.alunoId,
          projetoId: inscricaoData.projetoId,
          inscricaoId: parseInt(input.inscricaoId),
          tipo: input.tipoBolsa,
          dataInicio: new Date(), // Definir data de início padrão
        }).returning()

        // Atualizar status da inscrição
        await tx.update(inscricaoTable)
          .set({
            status: input.tipoBolsa === 'BOLSISTA' ? 'ACCEPTED_BOLSISTA' : 'ACCEPTED_VOLUNTARIO',
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
            with: { user: true }
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true }
              }
            }
          }
        }
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
      await ctx.db.update(inscricaoTable)
        .set({
          status: 'REJECTED_BY_STUDENT',
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
  getMyVagas: protectedProcedure
    .query(async ({ ctx }) => {
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
                with: { user: true }
              }
            }
          },
          aluno: {
            with: { user: true }
          }
        },
        orderBy: [desc(vagaTable.createdAt)]
      })

      return vagas.map(vaga => ({
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
            with: { user: true }
          },
          projeto: true,
        },
        orderBy: [desc(vagaTable.createdAt)]
      })

      return {
        projeto,
        vagas: vagas.map(vaga => ({
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
            }
          },
          status: 'ATIVA', // Por enquanto todas são ativas
        }))
      }
    }),
})