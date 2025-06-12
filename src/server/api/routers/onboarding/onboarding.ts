import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
import {
  alunoTable,
  disciplinaProfessorResponsavelTable,
  professorTable,
  onboardingStatusResponseSchema,
} from '@/server/db/schema'
import { getCurrentSemester } from '@/utils/utils'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'OnboardingRouter' })

export const REQUIRED_DOCUMENTS = {
  student: ['comprovante_matricula'], // Apenas comprovante de matrícula é obrigatório
  professor: ['curriculum_vitae', 'comprovante_vinculo'],
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
  disciplinas?: { configured: boolean }
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
        let profileData: any = null
        let hasDisciplinas = false

        if (userRole === 'student') {
          profileData = await db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, userId),
          })
          hasProfile = !!profileData
        } else if (userRole === 'professor') {
          profileData = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
          })
          hasProfile = !!profileData

          if (hasProfile) {
            const { year, semester } = getCurrentSemester()
            const result = await db.query.disciplinaProfessorResponsavelTable.findFirst({
              where: and(
                eq(disciplinaProfessorResponsavelTable.professorId, profileData.id),
                eq(disciplinaProfessorResponsavelTable.ano, year),
                eq(disciplinaProfessorResponsavelTable.semestre, semester)
              ),
            })
            hasDisciplinas = !!result
          }
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
        if (userRole === 'student' && profileData) {
          if (profileData.comprovanteMatriculaFileId) {
            uploadedDocTypes.push('comprovante_matricula')
          }
          if (profileData.historicoEscolarFileId) {
            uploadedDocTypes.push('historico_escolar')
          }
        }

        // Para professores, verificar documentos no perfil
        if (userRole === 'professor' && profileData) {
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
          pending = pending || !hasDisciplinas
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
            disciplinas: { configured: hasDisciplinas },
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
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
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

        const existingProfile = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, ctx.user.id),
        })

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Student profile already exists',
          })
        }

        const [newProfile] = await db
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
        matriculaSiape: z.string().optional(),
        cpf: z.string().min(11),
        telefone: z.string().optional(),
        telefoneInstitucional: z.string().optional(),
        regime: z.enum(['20H', '40H', 'DE']),
        departamentoId: z.number(),
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
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

        const existingProfile = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Professor profile already exists',
          })
        }

        const [newProfile] = await db
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
          const profile = await db.query.alunoTable.findFirst({
            where: eq(alunoTable.userId, ctx.user.id),
          })

          if (!profile) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Student profile not found',
            })
          }

          const updateData: any = {}
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

          await db.update(alunoTable).set(updateData).where(eq(alunoTable.userId, ctx.user.id))
        } else if (ctx.user.role === 'professor') {
          const profile = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, ctx.user.id),
          })

          if (!profile) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Professor profile not found',
            })
          }

          const updateData: any = {}
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

          await db.update(professorTable).set(updateData).where(eq(professorTable.userId, ctx.user.id))
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

  linkDisciplinas: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/link-disciplinas',
        tags: ['onboarding'],
        summary: 'Link disciplines to professor',
        description: 'Link selected disciplines to professor during onboarding',
      },
    })
    .input(
      z.object({
        disciplinaIds: z.array(z.number()),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        linkedCount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== 'professor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only professors can link disciplines',
          })
        }

        const professorProfile = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, ctx.user.id),
        })

        if (!professorProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Professor profile not found',
          })
        }

        const { year, semester } = getCurrentSemester()

        // Remove existing links for current semester
        await db
          .delete(disciplinaProfessorResponsavelTable)
          .where(
            and(
              eq(disciplinaProfessorResponsavelTable.professorId, professorProfile.id),
              eq(disciplinaProfessorResponsavelTable.ano, year),
              eq(disciplinaProfessorResponsavelTable.semestre, semester)
            )
          )

        // Add new links
        if (input.disciplinaIds.length > 0) {
          const links = input.disciplinaIds.map((disciplinaId) => ({
            professorId: professorProfile.id,
            disciplinaId,
            ano: year,
            semestre: semester,
          }))

          await db.insert(disciplinaProfessorResponsavelTable).values(links)
        }

        log.info(
          {
            userId: ctx.user.id,
            professorId: professorProfile.id,
            disciplinaIds: input.disciplinaIds,
          },
          'Disciplines linked successfully'
        )

        return { success: true, linkedCount: input.disciplinaIds.length }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        log.error(error, 'Error linking disciplines')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error linking disciplines',
        })
      }
    }),
})
