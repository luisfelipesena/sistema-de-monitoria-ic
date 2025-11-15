import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import {
  generoSchema,
  onboardingStatusResponseSchema,
  regimeSchema,
  documentTypeSchema,
  type OnboardingStatusResponse,
} from '@/types'
import { createOnboardingService } from '@/server/services/onboarding/onboarding-service'
import { z } from 'zod'

export type { OnboardingStatusResponse }

export const REQUIRED_DOCUMENTS = {
  student: ['comprovante_matricula'],
  professor: [],
} as const

export const onboardingRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/onboarding/status',
        tags: ['onboarding'],
        summary: 'Get onboarding status',
        description: 'Retrieve the onboarding status',
      },
    })
    .input(z.void())
    .output(onboardingStatusResponseSchema)
    .query(async ({ ctx }) => {
      const service = createOnboardingService(ctx.db)
      return service.getStatus(ctx.user.id, ctx.user.role, ctx.user.assinaturaDefault)
    }),

  createStudentProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/student-profile',
        tags: ['onboarding'],
        summary: 'Create student profile',
        description: 'Create initial student profile during onboarding',
      },
    })
    .input(
      z.object({
        nomeCompleto: z.string().min(1),
        matricula: z.string().min(1),
        cpf: z.string().min(11),
        cr: z.number().min(0).max(10),
        cursoId: z.number(),
        telefone: z.string().optional(),
        genero: generoSchema,
        especificacaoGenero: z.string().optional(),
        nomeSocial: z.string().optional(),
        rg: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        profileId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createOnboardingService(ctx.db)
      return service.createStudentProfile(input, ctx.user.id, ctx.user.role, ctx.user.email)
    }),

  createProfessorProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/professor-profile',
        tags: ['onboarding'],
        summary: 'Create professor profile',
        description: 'Create initial professor profile during onboarding',
      },
    })
    .input(
      z.object({
        nomeCompleto: z.string().min(1),
        matriculaSiape: z.string().min(1),
        cpf: z.string().min(11),
        telefone: z.string().optional(),
        telefoneInstitucional: z.string().optional(),
        regime: regimeSchema,
        departamentoId: z.number(),
        genero: generoSchema,
        especificacaoGenero: z.string().optional(),
        nomeSocial: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        profileId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createOnboardingService(ctx.db)
      return service.createProfessorProfile(input, ctx.user.id, ctx.user.role, ctx.user.email)
    }),

  updateDocument: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/onboarding/document',
        tags: ['onboarding'],
        summary: 'Update document file',
        description: 'Update document file ID in user profile',
      },
    })
    .input(
      z.object({
        documentType: documentTypeSchema,
        fileId: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = createOnboardingService(ctx.db)
      return service.updateDocument(input.documentType, input.fileId, ctx.user.id, ctx.user.role)
    }),
})
