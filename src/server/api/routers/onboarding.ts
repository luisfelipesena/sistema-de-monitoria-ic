import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import {
  alunoTable,
  enderecoTable,
  professorDisciplinaTable,
  professorInvitationTable,
  professorTable,
  userTable,
} from "@/server/db/schema"
import { UserRole } from "@/types/enums"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const onboardingRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/onboarding/status',
        tags: ['onboarding'],
        summary: 'Get user onboarding status',
        description: 'Check if the user has completed their profile setup',
      },
    })
    .input(z.object({
      userId: z.number(),
    }))
    .output(
      z.object({
        isComplete: z.boolean(),
        step: z.enum(['pending', 'documents', 'profile', 'complete']),
        missingFields: z.array(z.string()),
        profile: z.object({
          hasProfile: z.boolean(),
          hasDocuments: z.boolean(),
          hasSignature: z.boolean(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.userTable.findFirst({
        where: eq(userTable.id, input.userId),
      })

      if (!user) {
        throw new Error('User not found')
      }

      const missingFields: string[] = []
      let hasProfile = false
      let hasDocuments = false
      let hasSignature = false

      if (user.role === UserRole.STUDENT) {
        const student = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, input.userId),
        })

        if (student) {
          hasProfile = true
          hasDocuments = !!(student.comprovanteMatriculaFileId)
          hasSignature = !!(user.assinaturaDefault)

          if (!student.nomeCompleto) missingFields.push('nomeCompleto')
          if (!student.matricula) missingFields.push('matricula')
          if (!student.cpf) missingFields.push('cpf')
          if (!student.emailInstitucional) missingFields.push('emailInstitucional')
          if (!student.comprovanteMatriculaFileId) missingFields.push('comprovanteMatricula')
        } else {
          missingFields.push('profile')
        }
      } else if (user.role === UserRole.PROFESSOR) {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, input.userId),
        })

        if (professor) {
          hasProfile = true
          hasSignature = !!(professor.assinaturaDefault || user.assinaturaDefault)

          if (!professor.nomeCompleto) missingFields.push('nomeCompleto')
          if (!professor.matriculaSiape) missingFields.push('matriculaSiape')
          if (!professor.emailInstitucional) missingFields.push('emailInstitucional')
          if (!professor.cpf) missingFields.push('cpf')
        } else {
          missingFields.push('profile')
        }
      }

      let step: 'pending' | 'documents' | 'profile' | 'complete' = 'pending'

      if (missingFields.length === 0) {
        step = 'complete'
      } else if (hasProfile && missingFields.includes('comprovanteMatricula')) {
        step = 'documents'
      } else if (hasProfile) {
        step = 'profile'
      }

      return {
        isComplete: missingFields.length === 0,
        step,
        missingFields,
        profile: {
          hasProfile,
          hasDocuments,
          hasSignature,
        },
      }
    }),

  completeStudentOnboarding: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/student/complete',
        tags: ['onboarding'],
        summary: 'Complete student onboarding',
        description: 'Complete the student onboarding process with all required information',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string(),
        matricula: z.string(),
        cpf: z.string(),
        cr: z.number().min(0).max(10),
        cursoId: z.number(),
        emailInstitucional: z.string().email(),
        telefone: z.string().optional(),
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).default('OUTRO'),
        comprovanteMatriculaFileId: z.string(),
        historicoEscolarFileId: z.string().optional(),
        endereco: z.object({
          rua: z.string(),
          numero: z.number().optional(),
          bairro: z.string(),
          cidade: z.string(),
          estado: z.string(),
          cep: z.string(),
          complemento: z.string().optional(),
        }).optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        profileId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingStudent = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, input.userId),
        })

        if (existingStudent) {
          return {
            success: false,
            error: "Student profile already exists",
          }
        }

        const result = await ctx.db.transaction(async (tx) => {
          await tx.update(userTable).set({ role: UserRole.STUDENT }).where(eq(userTable.id, input.userId))

          let enderecoId = null
          if (input.endereco) {
            const [endereco] = await tx
              .insert(enderecoTable)
              .values({
                rua: input.endereco.rua,
                numero: input.endereco.numero || null,
                bairro: input.endereco.bairro,
                cidade: input.endereco.cidade,
                estado: input.endereco.estado,
                cep: input.endereco.cep,
                complemento: input.endereco.complemento || null,
              })
              .returning()
            enderecoId = endereco.id
          }

          const [aluno] = await tx
            .insert(alunoTable)
            .values({
              userId: input.userId,
              nomeCompleto: input.nomeCompleto,
              matricula: input.matricula,
              cpf: input.cpf,
              cr: input.cr,
              cursoId: input.cursoId,
              emailInstitucional: input.emailInstitucional,
              telefone: input.telefone || null,
              genero: input.genero,
              comprovanteMatriculaFileId: input.comprovanteMatriculaFileId,
              historicoEscolarFileId: input.historicoEscolarFileId,
              enderecoId,
            })
            .returning()

          return aluno
        })

        return {
          success: true,
          profileId: result.id,
        }
      } catch (error) {
        console.error("Error completing student onboarding:", error)
        return {
          success: false,
          error: "Failed to complete onboarding",
        }
      }
    }),

  completeProfessorOnboarding: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/professor/complete',
        tags: ['onboarding'],
        summary: 'Complete professor onboarding',
        description: 'Complete the professor onboarding process with all required information',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string(),
        matriculaSiape: z.string(),
        emailInstitucional: z.string().email(),
        telefone: z.string().optional(),
        telefoneInstitucional: z.string().optional(),
        departamentoId: z.number(),
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).default('OUTRO'),
        regime: z.enum(['20H', '40H', 'DE']).default('DE'),
        cpf: z.string(),
        titulo: z.enum(['GRADUACAO', 'ESPECIALIZACAO', 'MESTRADO', 'DOUTORADO', 'POS_DOUTORADO']).optional(),
        lattes: z.string().url().optional(),
        disciplinaIds: z.array(z.number()).optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        profileId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingProfessor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, input.userId),
        })

        if (existingProfessor) {
          return {
            success: false,
            error: "Professor profile already exists",
          }
        }

        const result = await ctx.db.transaction(async (tx) => {
          await tx.update(userTable).set({ role: UserRole.PROFESSOR }).where(eq(userTable.id, input.userId))

          const [professor] = await tx
            .insert(professorTable)
            .values({
              userId: input.userId,
              nomeCompleto: input.nomeCompleto,
              matriculaSiape: input.matriculaSiape,
              emailInstitucional: input.emailInstitucional,
              telefone: input.telefone || null,
              telefoneInstitucional: input.telefoneInstitucional || null,
              departamentoId: input.departamentoId,
              genero: input.genero,
              regime: input.regime,
              cpf: input.cpf,
            })
            .returning()

          if (input.disciplinaIds && input.disciplinaIds.length > 0) {
            const currentDate = new Date()
            const currentYear = currentDate.getFullYear()
            const currentMonth = currentDate.getMonth()
            const currentSemester = currentMonth < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'

            await tx.insert(professorDisciplinaTable).values(
              input.disciplinaIds.map((disciplinaId) => ({
                professorId: professor.id,
                disciplinaId,
                ano: currentYear,
                semestre: currentSemester as 'SEMESTRE_1' | 'SEMESTRE_2',
              }))
            )
          }

          return professor
        })

        return {
          success: true,
          profileId: result.id,
        }
      } catch (error) {
        console.error("Error completing professor onboarding:", error)
        return {
          success: false,
          error: "Failed to complete onboarding",
        }
      }
    }),

  acceptInvitationAndOnboard: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/onboarding/accept-invitation',
        tags: ['onboarding', 'invitation'],
        summary: 'Accept invitation and onboard professor',
        description: 'Allows a professor to accept their invitation and complete their profile in one step.',
      },
    })
    .input(
      z.object({
        token: z.string(),
        nomeCompleto: z.string(),
        matriculaSiape: z.string(),
        emailInstitucional: z.string().email(),
        telefone: z.string().optional(),
        telefoneInstitucional: z.string().optional(),
        departamentoId: z.number(),
        genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).default('OUTRO'),
        regime: z.enum(['20H', '40H', 'DE']).default('DE'),
        cpf: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        userId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { token, ...professorData } = input

      const invitation = await ctx.db.query.professorInvitationTable.findFirst({
        where: eq(professorInvitationTable.token, token),
      })

      if (!invitation) {
        return { success: false, error: 'Convite não encontrado.' }
      }
      if (invitation.status !== 'PENDING') {
        return { success: false, error: 'Este convite não é mais válido.' }
      }
      if (invitation.expiresAt < new Date()) {
        return { success: false, error: 'Este convite expirou.' }
      }
      if (invitation.email !== professorData.emailInstitucional) {
        return { success: false, error: 'O email informado não corresponde ao do convite.' }
      }

      try {
        const result = await ctx.db.transaction(async (tx) => {
          // 1. Create User
          const [newUser] = await tx
            .insert(userTable)
            .values({
              username: professorData.emailInstitucional.split('@')[0], // Or generate a unique username
              email: professorData.emailInstitucional,
              role: UserRole.PROFESSOR,
            })
            .returning()

          // 2. Create Professor profile
          const [newProfessor] = await tx
            .insert(professorTable)
            .values({
              userId: newUser.id,
              nomeCompleto: professorData.nomeCompleto,
              matriculaSiape: professorData.matriculaSiape,
              emailInstitucional: professorData.emailInstitucional,
              telefone: professorData.telefone,
              telefoneInstitucional: professorData.telefoneInstitucional,
              departamentoId: professorData.departamentoId,
              genero: professorData.genero,
              regime: professorData.regime,
              cpf: professorData.cpf,
            })
            .returning()

          // 3. Update invitation status
          await tx
            .update(professorInvitationTable)
            .set({
              status: 'ACCEPTED',
              acceptedByUserId: newUser.id,
              acceptedAt: new Date(),
            })
            .where(eq(professorInvitationTable.id, invitation.id))

          return { userId: newUser.id, professorId: newProfessor.id }
        })

        return { success: true, userId: result.userId }
      } catch (error) {
        // Check for unique constraint violation on user email
        if (error instanceof Error && error.message.includes('unique constraint')) {
          return { success: false, error: 'Um usuário com este email já existe no sistema.' }
        }
        console.error("Error accepting invitation and onboarding:", error)
        return {
          success: false,
          error: "Falha ao criar perfil. Por favor, tente novamente.",
        }
      }
    }),
})