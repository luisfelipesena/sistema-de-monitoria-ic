import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { alunoTable, professorTable } from '@/server/db/schema'
import { generoSchema, onboardingStatusResponseSchema, regimeSchema } from '@/types'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

type StudentProfile = typeof alunoTable.$inferSelect
type ProfessorProfile = typeof professorTable.$inferSelect

const isStudentProfile = (profile: StudentProfile | ProfessorProfile | null): profile is StudentProfile => {
  return profile != null && 'comprovanteMatriculaFileId' in profile
}

const isProfessorProfile = (profile: StudentProfile | ProfessorProfile | null): profile is ProfessorProfile => {
  return profile != null && 'curriculumVitaeFileId' in profile
}

const log = logger.child({ context: 'OnboardingRouter' })

export const REQUIRED_DOCUMENTS = {
  student: ['comprovante_matricula'], // Apenas comprovante de matrícula é obrigatório
  professor: [], // Nenhum documento obrigatório
} as const

export interface OnboardingStatusResponse {
  pending: boolean
  profile: {
    exists: boolean
    type: 'student' | 'professor' | 'admin'
  }
  documents: {
    required: string[]
    uploaded: string[]
    missing: string[]
  }
  signature?: { configured: boolean }
}

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
      try {
        const userRole = ctx.user.role
        const userId = ctx.user.id

        // Admin não precisa de onboarding
        if (userRole === 'admin') {
          return {
            pending: false,
            profile: { exists: false, type: 'admin' as const },
            documents: { required: [], uploaded: [], missing: [] },
          }
        }

        // Verificar se existe perfil
        let hasProfile = false
        let profileData: StudentProfile | ProfessorProfile | null = null
        let hasSignature = false

        if (userRole === 'student') {
          const alunoProfile = await ctx.db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, userId),
          })
          profileData = alunoProfile ?? null
          hasProfile = alunoProfile != null
        } else if (userRole === 'professor') {
          const professorProfile = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
          })
          profileData = professorProfile ?? null
          hasProfile = professorProfile != null

          // Check signature in user table (saved via saveDefaultSignature)
          hasSignature = !!ctx.user.assinaturaDefault
        }

        // Verificar documentos obrigatórios
        const requiredDocs =
          userRole === 'student'
            ? [...REQUIRED_DOCUMENTS.student]
            : userRole === 'professor'
              ? [...REQUIRED_DOCUMENTS.professor]
              : []

        // Verificar documentos já enviados baseado nos fileIds nos perfis
        const uploadedDocTypes: string[] = []

        // Para estudantes, verificar se tem documentos obrigatórios no perfil
        if (userRole === 'student' && isStudentProfile(profileData)) {
          if (profileData.comprovanteMatriculaFileId) {
            uploadedDocTypes.push('comprovante_matricula')
          }
          if (profileData.historicoEscolarFileId) {
            uploadedDocTypes.push('historico_escolar')
          }
        }

        // Para professores, verificar documentos no perfil
        if (userRole === 'professor' && isProfessorProfile(profileData)) {
          if (profileData.curriculumVitaeFileId) {
            uploadedDocTypes.push('curriculum_vitae')
          }
          if (profileData.comprovanteVinculoFileId) {
            uploadedDocTypes.push('comprovante_vinculo')
          }
        }

        const uniqueUploadedDocs = [...new Set(uploadedDocTypes)]
        const missingDocs = requiredDocs.filter((doc) => !uniqueUploadedDocs.includes(doc))

        // Onboarding está pendente se não tem perfil OU se faltam documentos obrigatórios
        let pending = !hasProfile || missingDocs.length > 0
        if (userRole === 'professor') {
          pending = pending || !hasSignature
        }

        const result = {
          pending,
          profile: {
            exists: hasProfile,
            type: userRole as 'student' | 'professor' | 'admin',
          },
          documents: {
            required: requiredDocs,
            uploaded: uniqueUploadedDocs,
            missing: missingDocs,
          },
        }

        if (userRole === 'professor') {
          return {
            ...result,
            signature: { configured: hasSignature },
          }
        }

        return result
      } catch (error) {
        console.error('Erro ao verificar status de onboarding', error)
        return {
          pending: false,
          profile: { exists: false, type: 'admin' as const },
          documents: { required: [], uploaded: [], missing: [] },
        }
      }
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
      try {
        if (ctx.user.role !== 'student') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only students can create student profiles',
          })
        }

        const existingProfile = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Student profile already exists',
          })
        }

        const [newProfile] = await ctx.db
          .insert(alunoTable)
          .values({
            userId: ctx.user.id,
            nomeCompleto: input.nomeCompleto,
            matricula: input.matricula,
            cpf: input.cpf,
            cr: input.cr,
            cursoId: input.cursoId,
            telefone: input.telefone,
            genero: input.genero,
            especificacaoGenero: input.especificacaoGenero,
            nomeSocial: input.nomeSocial,
            rg: input.rg,
            emailInstitucional: ctx.user.email,
          })
          .returning({ id: alunoTable.id })

        log.info({ userId: ctx.user.id, profileId: newProfile.id }, 'Student profile created successfully')
        return { success: true, profileId: newProfile.id }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error creating student profile')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating profile',
        })
      }
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
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only professors can create professor profiles',
          })
        }

        const existingProfile = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Professor profile already exists',
          })
        }

        const [newProfile] = await ctx.db
          .insert(professorTable)
          .values({
            userId: ctx.user.id,
            nomeCompleto: input.nomeCompleto,
            matriculaSiape: input.matriculaSiape,
            cpf: input.cpf,
            telefone: input.telefone,
            telefoneInstitucional: input.telefoneInstitucional,
            regime: input.regime,
            departamentoId: input.departamentoId,
            genero: input.genero,
            especificacaoGenero: input.especificacaoGenero,
            nomeSocial: input.nomeSocial,
            emailInstitucional: ctx.user.email,
          })
          .returning({ id: professorTable.id })

        log.info({ userId: ctx.user.id, profileId: newProfile.id }, 'Professor profile created successfully')
        return { success: true, profileId: newProfile.id }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error creating professor profile')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating profile',
        })
      }
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
        documentType: z.enum(['comprovante_matricula', 'historico_escolar', 'curriculum_vitae', 'comprovante_vinculo']),
        fileId: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { documentType, fileId } = input

        if (ctx.user.role === 'student') {
          const profile = await ctx.db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, ctx.user.id),
          })

          if (!profile) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Student profile not found',
            })
          }

          const updateData: Partial<typeof alunoTable.$inferInsert> = {}
          if (documentType === 'comprovante_matricula') {
            updateData.comprovanteMatriculaFileId = fileId
          } else if (documentType === 'historico_escolar') {
            updateData.historicoEscolarFileId = fileId
          } else {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid document type for student',
            })
          }

          await ctx.db.update(alunoTable).set(updateData).where(eq(alunoTable.userId, ctx.user.id))
        } else if (ctx.user.role === 'professor') {
          const profile = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!profile) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Professor profile not found',
            })
          }

          const updateData: Partial<typeof professorTable.$inferInsert> = {}
          if (documentType === 'curriculum_vitae') {
            updateData.curriculumVitaeFileId = fileId
          } else if (documentType === 'comprovante_vinculo') {
            updateData.comprovanteVinculoFileId = fileId
          } else {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid document type for professor',
            })
          }

          await ctx.db.update(professorTable).set(updateData).where(eq(professorTable.userId, ctx.user.id))
        } else {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only students and professors can update documents',
          })
        }

        log.info({ userId: ctx.user.id, documentType, fileId }, 'Document updated successfully')
        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error updating document')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating document',
        })
      }
    }),
})
