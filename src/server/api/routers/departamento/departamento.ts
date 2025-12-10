import { adminProtectedProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { BusinessError, NotFoundError } from '@/server/lib/errors'
import { createDepartamentoRepository } from '@/server/services/departamento/departamento-repository'
import { createDepartamentoService } from '@/server/services/departamento/departamento-service'
import { createDepartmentSchema, departamentoSchema, updateDepartmentSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

const log = logger.child({ context: 'DepartamentoRouter' })

export const departamentoRouter = createTRPCRouter({
  getDepartamentos: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamentos',
        tags: ['departamentos'],
        summary: 'Get departamentos',
        description: 'Retrieve all departamentos with statistics',
      },
    })
    .input(z.object({ includeStats: z.boolean().default(false) }))
    .output(z.array(departamentoSchema))
    .query(async ({ input, ctx }) => {
      try {
        const repository = createDepartamentoRepository(ctx.db)
        const service = createDepartamentoService(repository)
        const departamentos = await service.getDepartamentos(input.includeStats)
        log.info(`Departamentos recuperados com sucesso (${input.includeStats ? 'com' : 'sem'} estatísticas)`)
        return departamentos
      } catch (error) {
        log.error(error, 'Erro ao recuperar departamentos')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao recuperar departamentos' })
      }
    }),

  getDepartamento: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Get departamento',
        description: 'Retrieve a specific departamento',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(departamentoSchema)
    .query(async ({ input, ctx }) => {
      try {
        const repository = createDepartamentoRepository(ctx.db)
        const service = createDepartamentoService(repository)
        return await service.getDepartamento(input.id)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
    }),

  createDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/departamentos',
        tags: ['departamentos'],
        summary: 'Create departamento',
        description: 'Create a new departamento',
      },
    })
    .input(createDepartmentSchema)
    .output(departamentoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const repository = createDepartamentoRepository(ctx.db)
        const service = createDepartamentoService(repository)
        const departamento = await service.createDepartamento(input)
        log.info({ departamentoId: departamento.id }, 'Departamento criado com sucesso')
        return departamento
      } catch (error) {
        log.error(error, 'Erro ao criar departamento')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar departamento' })
      }
    }),

  updateDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Update departamento',
        description: 'Update an existing departamento',
      },
    })
    .input(updateDepartmentSchema)
    .output(departamentoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateData } = input
        const repository = createDepartamentoRepository(ctx.db)
        const service = createDepartamentoService(repository)
        return await service.updateDepartamento(id, updateData)
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
    }),

  deleteDepartamento: adminProtectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/departamentos/{id}',
        tags: ['departamentos'],
        summary: 'Delete departamento',
        description: 'Delete a departamento and all its dependencies',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const repository = createDepartamentoRepository(ctx.db)
        const service = createDepartamentoService(repository)
        const result = await service.deleteDepartamento(input.id)
        log.info({ departamentoId: input.id }, 'Departamento e dependências deletados com sucesso')
        return result
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
        }
        if (error instanceof BusinessError) {
          throw new TRPCError({ code: 'CONFLICT', message: error.message })
        }
        log.error(error, 'Erro ao deletar departamento')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar departamento e suas dependências',
        })
      }
    }),
})
