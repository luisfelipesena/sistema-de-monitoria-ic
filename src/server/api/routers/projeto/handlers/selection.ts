import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  ataSelecaoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import { emailService } from '@/server/lib/email-service'
import { anoSchema, idSchema, nameSchema, REJECTED_BY_PROFESSOR, SELECTED_BOLSISTA, SELECTED_VOLUNTARIO } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.Selection' })

export const generateSelectionMinutesDataHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/projetos/{projetoId}/ata-selecao-data',
      tags: ['projetos'],
      summary: 'Get selection minutes data',
      description: 'Get data for generating selection minutes PDF',
    },
  })
  .input(z.object({ projetoId: idSchema }))
  .output(
    z.object({
      projeto: z.object({
        id: idSchema,
        titulo: nameSchema,
        ano: anoSchema,
        semestre: z.string(),
        departamento: z.object({
          nome: nameSchema,
          sigla: z.string().nullable(),
        }),
        professorResponsavel: z.object({
          nomeCompleto: nameSchema,
          matriculaSiape: z.string().nullable(),
        }),
        disciplinas: z.array(
          z.object({
            codigo: z.string(),
            nome: nameSchema,
          })
        ),
      }),
      candidatos: z.array(
        z.object({
          id: idSchema,
          aluno: z.object({
            nomeCompleto: nameSchema,
            matricula: z.string().nullable(),
            cr: z.number().nullable(),
          }),
          tipoVagaPretendida: z.string().nullable(),
          notaDisciplina: z.number().nullable(),
          notaSelecao: z.number().nullable(),
          coeficienteRendimento: z.number().nullable(),
          notaFinal: z.number().nullable(),
          status: z.string(),
          observacoes: z.string().nullable(),
        })
      ),
      ataInfo: z.object({
        dataSelecao: z.string(),
        localSelecao: z.string().nullable(),
        observacoes: z.string().nullable(),
      }),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      // Verificar se é professor e se tem acesso ao projeto
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
        with: {
          departamento: true,
          professorResponsavel: true,
        },
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (ctx.user.role === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      }

      // Buscar disciplinas do projeto
      const disciplinas = await ctx.db
        .select({
          codigo: disciplinaTable.codigo,
          nome: disciplinaTable.nome,
          turma: disciplinaTable.turma,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

      // Buscar candidatos/inscrições do projeto
      const candidatos = await ctx.db
        .select({
          id: inscricaoTable.id,
          aluno: {
            nomeCompleto: alunoTable.nomeCompleto,
            matricula: alunoTable.matricula,
            cr: alunoTable.cr,
          },
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
          notaFinal: inscricaoTable.notaFinal,
          status: inscricaoTable.status,
          observacoes: inscricaoTable.feedbackProfessor,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .where(eq(inscricaoTable.projetoId, projeto.id))
        .orderBy(desc(inscricaoTable.notaFinal))

      // Dados da ata
      const ataInfo = {
        dataSelecao: new Date().toLocaleDateString('pt-BR'),
        localSelecao: null,
        observacoes: null,
      }

      // Transformar dados dos candidatos para match da interface
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
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao buscar dados da ata de seleção')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar dados da ata de seleção',
      })
    }
  })

export const saveSelectionMinutesHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/projetos/{projetoId}/ata-selecao',
      tags: ['projetos'],
      summary: 'Save selection minutes',
      description: 'Save selection minutes to database and MinIO',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
      dataSelecao: z.string().optional(),
      localSelecao: z.string().optional(),
      observacoes: z.string().optional(),
    })
  )
  .output(z.object({ success: z.boolean(), ataId: idSchema }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verificar se é professor e se tem acesso ao projeto
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (ctx.user.role === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      }

      // Verificar se já existe uma ata para este projeto
      const ataExistente = await ctx.db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.projetoId, input.projetoId),
      })

      let ataId: number

      if (ataExistente) {
        // Atualizar ata existente - apenas atualizamos dataGeracao
        await ctx.db
          .update(ataSelecaoTable)
          .set({
            dataGeracao: new Date(),
          })
          .where(eq(ataSelecaoTable.id, ataExistente.id))

        ataId = ataExistente.id
      } else {
        // Criar nova ata
        const [novaAta] = await ctx.db
          .insert(ataSelecaoTable)
          .values({
            projetoId: input.projetoId,
            geradoPorUserId: ctx.user.id,
          })
          .returning({ id: ataSelecaoTable.id })

        ataId = novaAta.id
      }

      log.info({ projetoId: input.projetoId, ataId }, 'Ata de seleção salva')
      return { success: true, ataId }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao salvar ata de seleção')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao salvar ata de seleção',
      })
    }
  })

export const notifySelectionResultsHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/projetos/{projetoId}/notify-results',
      tags: ['projetos'],
      summary: 'Notify selection results',
      description: 'Send email notifications to candidates about selection results',
    },
  })
  .input(
    z.object({
      projetoId: idSchema,
      mensagemPersonalizada: z.string().optional(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      notificationsCount: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Verificar se é professor e se tem acesso ao projeto
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), isNull(projetoTable.deletedAt)),
        with: {
          professorResponsavel: true,
        },
      })

      if (!projeto) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Projeto não encontrado',
        })
      }

      if (ctx.user.role === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a este projeto',
          })
        }
      }

      // Buscar candidatos com seus dados de usuário
      const candidatos = await ctx.db
        .select({
          inscricao: {
            id: inscricaoTable.id,
            status: inscricaoTable.status,
            feedbackProfessor: inscricaoTable.feedbackProfessor,
          },
          aluno: {
            id: alunoTable.id,
            nomeCompleto: alunoTable.nomeCompleto,
          },
          user: {
            email: userTable.email,
          },
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .where(eq(inscricaoTable.projetoId, input.projetoId))

      let notificationsCount = 0

      // Enviar notificações para todos os candidatos
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
              feedbackProfessor: candidato.inscricao.feedbackProfessor || input.mensagemPersonalizada,
              alunoId: candidato.aluno.id,
              projetoId: projeto.id,
            },
            ctx.user.id
          )

          notificationsCount++
        } catch (emailError) {
          log.error(
            {
              error: emailError,
              candidatoId: candidato.aluno.id,
              projetoId: input.projetoId,
            },
            'Erro ao enviar notificação para candidato'
          )
          // Continua enviando para os outros mesmo se um falhar
        }
      }

      log.info(
        {
          projetoId: input.projetoId,
          notificationsCount,
          totalCandidatos: candidatos.length,
        },
        'Notificações de resultado enviadas'
      )

      return {
        success: true,
        notificationsCount,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao notificar resultados')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao notificar resultados',
      })
    }
  })
