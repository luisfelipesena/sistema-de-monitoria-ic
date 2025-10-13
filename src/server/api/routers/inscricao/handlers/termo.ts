import { protectedProcedure } from '@/server/api/trpc'
import { alunoTable, disciplinaTable, inscricaoTable, professorTable, projetoDisciplinaTable } from '@/server/db/schema'
import { ACCEPTED_BOLSISTA, idSchema, tipoVagaSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'InscricaoRouter.Termo' })

export const generateCommitmentTermData = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/inscricoes/{inscricaoId}/termo-compromisso-data',
      tags: ['inscricoes'],
      summary: 'Get commitment term data',
      description: 'Get data for generating commitment term PDF',
    },
  })
  .input(z.object({ inscricaoId: idSchema }))
  .output(
    z.object({
      monitor: z.object({
        nome: z.string(),
        matricula: z.string().nullable(),
        email: z.string(),
        telefone: z.string().optional(),
        cr: z.number().nullable(),
      }),
      professor: z.object({
        nome: z.string(),
        matriculaSiape: z.string().optional(),
        email: z.string().nullable(),
        departamento: z.string(),
      }),
      projeto: z.object({
        titulo: z.string(),
        disciplinas: z.array(
          z.object({
            codigo: z.string(),
            nome: z.string(),
          })
        ),
        ano: z.number(),
        semestre: z.string(),
        cargaHorariaSemana: z.number(),
        numeroSemanas: z.number(),
      }),
      monitoria: z.object({
        tipo: tipoVagaSchema,
        dataInicio: z.string(),
        dataFim: z.string(),
        valorBolsa: z.number().optional(),
      }),
      termo: z.object({
        numero: z.string(),
        dataGeracao: z.string(),
      }),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const inscricao = await ctx.db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, input.inscricaoId),
        with: {
          aluno: {
            with: {
              user: true,
            },
          },
          projeto: {
            with: {
              professorResponsavel: true,
              departamento: true,
            },
          },
          periodoInscricao: {
            with: {
              edital: true,
            },
          },
        },
      })

      if (!inscricao) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscrição não encontrada',
        })
      }

      if (ctx.user.role === 'student') {
        const aluno = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (!aluno || inscricao.alunoId !== aluno.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a esta inscrição',
          })
        }
      } else if (ctx.user.role === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor || inscricao.projeto.professorResponsavelId !== professor.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado a esta inscrição',
          })
        }
      }

      if (!inscricao.status.includes('ACCEPTED_')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Termo de compromisso só pode ser gerado para vagas aceitas',
        })
      }

      const disciplinas = await ctx.db
        .select({
          codigo: disciplinaTable.codigo,
          nome: disciplinaTable.nome,
          turma: disciplinaTable.turma,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, inscricao.projetoId))

      const hoje = new Date()
      const inicioSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === 'SEMESTRE_1' ? 2 : 7, 1)
      const fimSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === 'SEMESTRE_1' ? 6 : 11, 30)

      const tipoMonitoria = inscricao.status === ACCEPTED_BOLSISTA ? 'BOLSISTA' : 'VOLUNTARIO'

      const numeroTermo = `${inscricao.projeto.ano}${inscricao.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}-${inscricao.id.toString().padStart(4, '0')}`

      return {
        monitor: {
          nome: inscricao.aluno.nomeCompleto,
          matricula: inscricao.aluno.matricula,
          email: inscricao.aluno.user.email,
          telefone: inscricao.aluno.telefone || undefined,
          cr: inscricao.aluno.cr,
        },
        professor: {
          nome: inscricao.projeto.professorResponsavel.nomeCompleto,
          matriculaSiape: inscricao.projeto.professorResponsavel.matriculaSiape || undefined,
          email: inscricao.projeto.professorResponsavel.emailInstitucional,
          departamento: inscricao.projeto.departamento.nome,
        },
        projeto: {
          titulo: inscricao.projeto.titulo,
          disciplinas,
          ano: inscricao.projeto.ano,
          semestre: inscricao.projeto.semestre,
          cargaHorariaSemana: inscricao.projeto.cargaHorariaSemana,
          numeroSemanas: inscricao.projeto.numeroSemanas,
        },
        monitoria: {
          tipo: tipoMonitoria,
          dataInicio: inicioSemestre.toLocaleDateString('pt-BR'),
          dataFim: fimSemestre.toLocaleDateString('pt-BR'),
          valorBolsa:
            tipoMonitoria === 'BOLSISTA' ? parseFloat(inscricao.periodoInscricao.edital.valorBolsa) : undefined,
        },
        termo: {
          numero: numeroTermo,
          dataGeracao: hoje.toLocaleDateString('pt-BR'),
        },
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao buscar dados do termo de compromisso')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar dados do termo de compromisso',
      })
    }
  })
