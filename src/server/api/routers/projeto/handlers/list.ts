import { protectedProcedure } from '@/server/api/trpc'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/db/schema'
import { projectListItemSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

const log = logger.child({ context: 'ProjetoRouter.List' })

export const getProjetosHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/projetos',
      tags: ['projetos'],
      summary: 'Get projetos',
      description: 'Retrieve projetos based on user role',
    },
  })
  .input(z.void())
  .output(z.array(projectListItemSchema))
  .query(async ({ ctx }) => {
    try {
      const userRole = ctx.user.role

      let whereCondition = eq(projetoTable.id, projetoTable.id)
      if (userRole === 'professor') {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professor) {
          return []
        }

        whereCondition = eq(projetoTable.professorResponsavelId, professor.id)
      }

      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          departamentoId: projetoTable.departamentoId,
          departamentoNome: departamentoTable.nome,
          professorResponsavelId: projetoTable.professorResponsavelId,
          professorResponsavelNome: professorTable.nomeCompleto,
          status: projetoTable.status,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          tipoProposicao: projetoTable.tipoProposicao,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          numeroSemanas: projetoTable.numeroSemanas,
          publicoAlvo: projetoTable.publicoAlvo,
          estimativaPessoasBenificiadas: projetoTable.estimativaPessoasBenificiadas,
          descricao: projetoTable.descricao,
          assinaturaProfessor: projetoTable.assinaturaProfessor,
          feedbackAdmin: projetoTable.feedbackAdmin,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          deletedAt: projetoTable.deletedAt,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(whereCondition, isNull(projetoTable.deletedAt)))
        .orderBy(projetoTable.createdAt)

      const inscricoesCount = await ctx.db
        .select({
          projetoId: inscricaoTable.projetoId,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          count: sql<number>`count(*)`,
        })
        .from(inscricaoTable)
        .groupBy(inscricaoTable.projetoId, inscricaoTable.tipoVagaPretendida)

      const inscricoesMap = new Map<string, number>()
      inscricoesCount.forEach((item) => {
        const key = `${item.projetoId}_${item.tipoVagaPretendida}`
        inscricoesMap.set(key, Number(item.count))
      })

      const projetosComDisciplinas = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await ctx.db
            .select({
              id: disciplinaTable.id,
              nome: disciplinaTable.nome,
              codigo: disciplinaTable.codigo,
              turma: disciplinaTable.turma,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

          const inscritosBolsista = inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0
          const inscritosVoluntario = inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0
          const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0
          const totalInscritos = inscritosBolsista + inscritosVoluntario + inscritosAny

          return {
            ...projeto,
            disciplinas,
            totalInscritos,
            inscritosBolsista,
            inscritosVoluntario,
          }
        })
      )

      log.info('Projetos recuperados com sucesso')
      return projetosComDisciplinas
    } catch (error) {
      log.error(error, 'Erro ao recuperar projetos')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar projetos',
      })
    }
  })

export const getAvailableProjectsHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/projetos/available',
      tags: ['projetos'],
      summary: 'Get available projects',
      description: 'Get projects available for student applications',
    },
  })
  .input(z.void())
  .output(
    z.array(
      z.object({
        id: z.number(),
        titulo: z.string(),
        descricao: z.string(),
        departamentoNome: z.string(),
        professorResponsavelNome: z.string(),
        ano: z.number(),
        semestre: z.string(),
        cargaHorariaSemana: z.number(),
        publicoAlvo: z.string(),
        disciplinas: z.array(
          z.object({
            codigo: z.string(),
            nome: z.string(),
            turma: z.string(),
          })
        ),
        bolsasDisponibilizadas: z.number(),
        voluntariosSolicitados: z.number(),
        totalInscritos: z.number(),
        inscricaoAberta: z.boolean(),
        jaInscrito: z.boolean(),
      })
    )
  )
  .query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== 'student') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas estudantes podem ver projetos disponíveis',
        })
      }

      const aluno = await ctx.db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      })

      if (!aluno) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Perfil de estudante não encontrado',
        })
      }

      // Get current active inscription period
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemester = now.getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

      const periodoAtivo = await ctx.db.query.periodoInscricaoTable.findFirst({
        where: and(
          eq(periodoInscricaoTable.ano, currentYear),
          eq(periodoInscricaoTable.semestre, currentSemester),
          lte(periodoInscricaoTable.dataInicio, now),
          gte(periodoInscricaoTable.dataFim, now)
        ),
      })

      // Get approved projects for current semester
      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          descricao: projetoTable.descricao,
          departamentoNome: departamentoTable.nome,
          professorResponsavelNome: professorTable.nomeCompleto,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          publicoAlvo: projetoTable.publicoAlvo,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(
          and(
            eq(projetoTable.status, 'APPROVED'),
            eq(projetoTable.ano, currentYear),
            eq(projetoTable.semestre, currentSemester),
            isNull(projetoTable.deletedAt)
          )
        )
        .orderBy(projetoTable.titulo)

      // Get student's inscriptions for these projects
      const inscricoes = await ctx.db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, aluno.id),
      })

      const inscricoesMap = new Map(inscricoes.map((i) => [i.projetoId, i]))

      // Get inscription counts for all projects
      const inscricoesCount = await ctx.db
        .select({
          projetoId: inscricaoTable.projetoId,
          count: sql<number>`count(*)`,
        })
        .from(inscricaoTable)
        .groupBy(inscricaoTable.projetoId)

      const inscricoesCountMap = new Map(inscricoesCount.map((i) => [i.projetoId, Number(i.count)]))

      const projetosComDisciplinas = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await ctx.db
            .select({
              codigo: disciplinaTable.codigo,
              nome: disciplinaTable.nome,
              turma: disciplinaTable.turma,
            })
            .from(disciplinaTable)
            .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
            .where(eq(projetoDisciplinaTable.projetoId, projeto.id))

          const totalInscritos = inscricoesCountMap.get(projeto.id) || 0
          const inscricaoAberta = !!periodoAtivo
          const jaInscrito = inscricoesMap.has(projeto.id)

          return {
            id: projeto.id,
            titulo: projeto.titulo,
            descricao: projeto.descricao,
            departamentoNome: projeto.departamentoNome,
            professorResponsavelNome: projeto.professorResponsavelNome,
            ano: projeto.ano,
            semestre: projeto.semestre,
            cargaHorariaSemana: projeto.cargaHorariaSemana,
            publicoAlvo: projeto.publicoAlvo,
            disciplinas,
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas || 0,
            voluntariosSolicitados: projeto.voluntariosSolicitados || 0,
            totalInscritos,
            inscricaoAberta,
            jaInscrito,
          }
        })
      )

      log.info('Projetos disponíveis recuperados com sucesso')
      return projetosComDisciplinas
    } catch (error) {
      if (error instanceof TRPCError) throw error
      log.error(error, 'Erro ao recuperar projetos disponíveis')
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao recuperar projetos disponíveis',
      })
    }
  })
