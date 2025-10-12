import { protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  atividadeProjetoTable,
  disciplinaTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
} from '@/server/db/schema'
import { idSchema, projectDetailSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const _log = logger.child({ context: 'ProjetoRouter.Detail' })

export const getProjetoHandler = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/projetos/{id}',
      tags: ['projetos'],
      summary: 'Get projeto',
      description: 'Retrieve a specific projeto with full details',
    },
  })
  .input(
    z.object({
      id: idSchema,
    })
  )
  .output(projectDetailSchema)
  .query(async ({ input, ctx }) => {
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: and(eq(projetoTable.id, input.id), isNull(projetoTable.deletedAt)),
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

    const [disciplinas, professoresParticipantes, atividades] = await Promise.all([
      db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
          turma: disciplinaTable.turma,
        })
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projeto.id)),

      db
        .select({
          id: professorTable.id,
          nomeCompleto: professorTable.nomeCompleto,
        })
        .from(professorTable)
        .innerJoin(
          projetoProfessorParticipanteTable,
          eq(professorTable.id, projetoProfessorParticipanteTable.professorId)
        )
        .where(eq(projetoProfessorParticipanteTable.projetoId, projeto.id)),

      db.query.atividadeProjetoTable.findMany({
        where: eq(atividadeProjetoTable.projetoId, projeto.id),
      }),
    ])

    return {
      ...projeto,
      professorResponsavel: {
        id: projeto.professorResponsavel.id,
        nomeCompleto: projeto.professorResponsavel.nomeCompleto,
        nomeSocial: projeto.professorResponsavel.nomeSocial,
        genero: projeto.professorResponsavel.genero,
        cpf: projeto.professorResponsavel.cpf,
        matriculaSiape: projeto.professorResponsavel.matriculaSiape,
        regime: projeto.professorResponsavel.regime,
        telefone: projeto.professorResponsavel.telefone,
        telefoneInstitucional: projeto.professorResponsavel.telefoneInstitucional,
        emailInstitucional: projeto.professorResponsavel.emailInstitucional,
      },
      disciplinas,
      professoresParticipantes,
      atividades,
    }
  })
