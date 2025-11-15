import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { BusinessError } from '@/server/lib/errors'
import { createDisciplineService } from '@/server/services/discipline/discipline-service'
import {
  checkEquivalenceSchema,
  createEquivalenceSchema,
  deleteEquivalenceSchema,
  disciplinaSchema,
  generoSchema,
  newDisciplinaSchema,
  regimeSchema,
  semestreSchema,
  updateDisciplineSchema,
} from '@/types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const disciplineRouter = createTRPCRouter({
  getDisciplineWithProfessor: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/{id}/professor',
        tags: ['disciplines'],
        summary: 'Get discipline with responsible professor',
        description: 'Get discipline details with responsible professor for current semester',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        disciplina: disciplinaSchema,
        professor: z
          .object({
            id: z.number(),
            nomeCompleto: z.string(),
            nomeSocial: z.string().nullable(),
            genero: generoSchema.nullable(),
            cpf: z.string().nullable(),
            matriculaSiape: z.string().nullable(),
            regime: regimeSchema.nullable(),
            telefone: z.string().nullable(),
            telefoneInstitucional: z.string().nullable(),
            emailInstitucional: z.string().nullable(),
          })
          .nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      const service = createDisciplineService(ctx.db)
      return service.getDisciplineWithProfessor(input.id)
    }),

  getDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines',
        tags: ['disciplines'],
        summary: 'Get disciplines',
        description: 'Retrieve the disciplines',
      },
    })
    .input(z.void())
    .output(z.array(disciplinaSchema))
    .query(async ({ ctx }) => {
      const service = createDisciplineService(ctx.db)
      return service.getAllDisciplines()
    }),

  getDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Get discipline',
        description: 'Retrieve the discipline',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(disciplinaSchema)
    .query(async ({ input, ctx }) => {
      const service = createDisciplineService(ctx.db)
      return service.getDisciplineById(input.id)
    }),

  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/disciplines',
        tags: ['disciplines'],
        summary: 'Create discipline',
        description: 'Create a new discipline',
      },
    })
    .input(newDisciplinaSchema)
    .output(disciplinaSchema)
    .mutation(async ({ input, ctx }) => {
      const service = createDisciplineService(ctx.db)
      return service.createDiscipline(input)
    }),

  updateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Update discipline',
        description: 'Update the discipline',
      },
    })
    .input(updateDisciplineSchema)
    .output(disciplinaSchema)
    .mutation(async ({ input, ctx }) => {
      const service = createDisciplineService(ctx.db)
      return service.updateDiscipline(input)
    }),

  deleteDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/disciplines/{id}',
        tags: ['disciplines'],
        summary: 'Delete discipline',
        description: 'Delete the discipline and all its dependencies',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        await service.deleteDiscipline(input.id)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw error
      }
    }),

  getProfessorDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/professor',
        tags: ['disciplines'],
        summary: 'Get professor disciplines',
        description: 'Get disciplines taught by the current professor',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          codigo: z.string(),
          nome: z.string(),
          cargaHoraria: z.number(),
          projetosAtivos: z.number(),
          monitoresAtivos: z.number(),
          voluntariosAtivos: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.getProfessorDisciplines(ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao recuperar disciplinas' })
      }
    }),

  getDepartmentDisciplines: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/disciplines/department',
        tags: ['disciplines'],
        summary: 'Get department disciplines',
        description: "Get all disciplines from professor's department (or all disciplines if no department associated)",
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          codigo: z.string(),
          nome: z.string(),
          departamentoId: z.number(),
          isAssociated: z.boolean(),
          ano: z.number().optional(),
          semestre: semestreSchema.optional(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.getDepartmentDisciplines(ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao recuperar disciplinas do departamento' })
      }
    }),

  associateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/disciplines/{id}/associate',
        tags: ['disciplines'],
        summary: 'Associate professor with discipline',
        description: 'Associate current professor with a discipline for a specific period',
      },
    })
    .input(z.object({ id: z.number(), ano: z.number(), semestre: semestreSchema }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.associateDiscipline(input.id, input.ano, input.semestre, ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao associar professor à disciplina' })
      }
    }),

  disassociateDiscipline: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/disciplines/{id}/disassociate',
        tags: ['disciplines'],
        summary: 'Disassociate professor from discipline',
        description: 'Remove association between professor and discipline for a specific period',
      },
    })
    .input(z.object({ id: z.number(), ano: z.number(), semestre: semestreSchema }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.disassociateDiscipline(input.id, input.ano, input.semestre, ctx.user.id, ctx.user.role)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao desassociar professor da disciplina' })
      }
    }),

  listEquivalences: adminProtectedProcedure
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          disciplinaOrigem: z.object({
            id: z.number(),
            codigo: z.string(),
            nome: z.string(),
          }),
          disciplinaEquivalente: z.object({
            id: z.number(),
            codigo: z.string(),
            nome: z.string(),
          }),
          createdAt: z.date(),
        })
      )
    )
    .query(async ({ ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.listEquivalences()
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar equivalências de disciplinas' })
      }
    }),

  createEquivalence: adminProtectedProcedure
    .input(createEquivalenceSchema)
    .output(z.object({ success: z.boolean(), id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.createEquivalence(input)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar equivalência de disciplinas' })
      }
    }),

  deleteEquivalence: adminProtectedProcedure
    .input(deleteEquivalenceSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.deleteEquivalence(input.id)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao deletar equivalência de disciplinas' })
      }
    }),

  checkEquivalence: protectedProcedure
    .input(checkEquivalenceSchema)
    .output(z.object({ isEquivalent: z.boolean() }))
    .query(async ({ input, ctx }) => {
      try {
        const service = createDisciplineService(ctx.db)
        return service.checkEquivalence(input)
      } catch (error) {
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: error.code as TRPCError['code'], message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao verificar equivalência de disciplinas' })
      }
    }),
})
