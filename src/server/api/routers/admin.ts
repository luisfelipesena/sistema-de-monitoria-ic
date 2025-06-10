import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  departamentoTable,
  disciplinaTable,
  professorInvitationTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  projetoTemplateTable,
  userTable,
} from '@/server/db/schema'
import { ProjetoStatus, Semestre, TipoNotificacao, UserRole } from '@/types/enums'
import { emailService } from '@/utils/email-service'
import { env } from '@/utils/env'
import { randomUUID } from 'crypto'
import { and, count, eq, inArray, sql } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { z } from 'zod'

export const adminRouter = createTRPCRouter({
  inviteProfessor: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/invite-professor',
        tags: ['admin', 'professors'],
        summary: 'Invite a new professor',
        description: 'Send an invitation email to a professor to join the system',
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        invitationId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingUser = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.email, input.email),
        })

        if (existingUser) {
          return {
            success: false,
            error: 'User with this email already exists',
          }
        }

        const existingInvitation = await ctx.db.query.professorInvitationTable.findFirst({
          where: and(eq(professorInvitationTable.email, input.email), eq(professorInvitationTable.status, 'PENDING')),
        })

        if (existingInvitation) {
          return {
            success: false,
            error: 'Pending invitation already exists for this email',
          }
        }

        const token = randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const [invitation] = await ctx.db
          .insert(professorInvitationTable)
          .values({
            email: input.email,
            token,
            status: 'PENDING',
            expiresAt,
            invitedByUserId: input.adminUserId,
          })
          .returning()

        const invitationLink = `${env.CLIENT_URL}/auth/accept-invitation?token=${token}`

        const adminUser = await ctx.db.query.userTable.findFirst({
          where: eq(userTable.id, input.adminUserId),
        })

        await emailService.sendProfessorInvitationEmail({
          professorEmail: input.email,
          invitationLink,
          adminName: adminUser?.username,
          remetenteUserId: input.adminUserId,
        })

        return {
          success: true,
          invitationId: invitation.id,
        }
      } catch (error) {
        console.error('Error inviting professor:', error)
        return {
          success: false,
          error: 'Failed to create invitation',
        }
      }
    }),

  listProfessorInvitations: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/professor-invitations',
        tags: ['admin', 'professors'],
        summary: 'List professor invitations',
        description: 'Get all professor invitations with their status',
      },
    })
    .input(
      z.object({
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']).optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          email: z.string(),
          status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
          expiresAt: z.date(),
          createdAt: z.date(),
          invitedBy: z.object({
            id: z.number(),
            username: z.string(),
          }),
          acceptedBy: z
            .object({
              id: z.number(),
              username: z.string(),
            })
            .nullable(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = []
      if (input.status) {
        conditions.push(eq(professorInvitationTable.status, input.status))
      }

      const invitations = await ctx.db
        .select({
          id: professorInvitationTable.id,
          email: professorInvitationTable.email,
          status: professorInvitationTable.status,
          expiresAt: professorInvitationTable.expiresAt,
          createdAt: professorInvitationTable.createdAt,
          invitedBy: {
            id: userTable.id,
            username: userTable.username,
          },
          acceptedBy: {
            id: sql<number | null>`accepted_user.id`,
            username: sql<string | null>`accepted_user.username`,
          },
        })
        .from(professorInvitationTable)
        .innerJoin(userTable, eq(professorInvitationTable.invitedByUserId, userTable.id))
        .leftJoin(
          sql`${userTable} as accepted_user`,
          eq(professorInvitationTable.acceptedByUserId, sql`accepted_user.id`)
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return invitations.map((inv) => ({
        ...inv,
        acceptedBy: inv.acceptedBy.id
          ? {
            id: inv.acceptedBy.id,
            username: inv.acceptedBy.username!,
          }
          : null,
      }))
    }),

  listAllProjects: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/projects',
        tags: ['admin', 'projects'],
        summary: 'List all projects',
        description: 'Get all projects in the system with admin perspective',
      },
    })
    .input(
      z.object({
        ano: z.number().optional(),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
        status: z.nativeEnum(ProjetoStatus).optional(),
        departamentoId: z.number().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          titulo: z.string(),
          ano: z.number(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          status: z.nativeEnum(ProjetoStatus),
          professorResponsavel: z.object({
            id: z.number(),
            nomeCompleto: z.string(),
          }),
          departamento: z.object({
            id: z.number(),
            nome: z.string(),
            sigla: z.string().nullable(),
          }),
          bolsasSolicitadas: z.number(),
          bolsasDisponibilizadas: z.number().nullable(),
          voluntariosSolicitados: z.number(),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.ano) {
        conditions.push(eq(projetoTable.ano, input.ano))
      }
      if (input.semestre) {
        conditions.push(eq(projetoTable.semestre, input.semestre))
      }
      if (input.status) {
        conditions.push(eq(projetoTable.status, input.status))
      }
      if (input.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, input.departamentoId))
      }

      const projects = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          status: projetoTable.status,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          professorResponsavel: {
            id: professorTable.id,
            nomeCompleto: professorTable.nomeCompleto,
          },
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(projetoTable)
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return projects.map((project) => ({
        ...project,
        status: project.status as ProjetoStatus,
      }))
    }),

  approveProject: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/projects/{id}/approve',
        tags: ['admin', 'projects'],
        summary: 'Approve a project',
        description: 'Approve a submitted project and set available scholarships',
      },
    })
    .input(
      z.object({
        id: z.number(),
        adminUserId: z.number(),
        bolsasDisponibilizadas: z.number().min(0),
        feedback: z.string().optional(),
        assinatura: z.string().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
        })

        if (!project) {
          return {
            success: false,
            error: 'Project not found',
          }
        }

        if (project.status !== ProjetoStatus.SUBMITTED) {
          return {
            success: false,
            error: 'Project is not in a state that can be approved',
          }
        }

        if (input.bolsasDisponibilizadas > project.bolsasSolicitadas) {
          return {
            success: false,
            error: 'Cannot approve more scholarships than requested',
          }
        }

        await ctx.db.transaction(async (tx) => {
          await tx
            .update(projetoTable)
            .set({
              status: ProjetoStatus.APPROVED,
              bolsasDisponibilizadas: input.bolsasDisponibilizadas,
              feedbackAdmin: input.feedback,
              updatedAt: new Date(),
            })
            .where(eq(projetoTable.id, input.id))
        })

        return { success: true }
      } catch (error) {
        console.error('Error approving project:', error)
        return {
          success: false,
          error: 'Failed to approve project',
        }
      }
    }),

  rejectProject: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/projects/{id}/reject',
        tags: ['admin', 'projects'],
        summary: 'Reject a project',
        description: 'Reject a submitted project with feedback',
      },
    })
    .input(
      z.object({
        id: z.number(),
        adminUserId: z.number(),
        feedback: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
        })

        if (!project) {
          return {
            success: false,
            error: 'Project not found',
          }
        }

        if (project.status !== ProjetoStatus.SUBMITTED) {
          return {
            success: false,
            error: 'Project is not in a state that can be rejected',
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            status: ProjetoStatus.REJECTED,
            feedbackAdmin: input.feedback,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error rejecting project:', error)
        return {
          success: false,
          error: 'Failed to reject project',
        }
      }
    }),

  getDashboardAnalytics: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/analytics/dashboard',
        tags: ['admin', 'analytics'],
        summary: 'Get dashboard analytics',
        description: 'Get key metrics for the admin dashboard',
      },
    })
    .input(z.void())
    .output(
      z.object({
        totalProjects: z.number(),
        projectsByStatus: z.record(z.string(), z.number()),
        totalProfessors: z.number(),
        totalStudents: z.number(),
        pendingInvitations: z.number(),
        totalScholarships: z.number(),
        occupiedScholarships: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const [
        totalProjectsResult,
        projectsByStatusResult,
        totalProfessorsResult,
        totalStudentsResult,
        pendingInvitationsResult,
      ] = await Promise.all([
        ctx.db.select({ count: count() }).from(projetoTable),
        ctx.db
          .select({
            status: projetoTable.status,
            count: count(),
          })
          .from(projetoTable)
          .groupBy(projetoTable.status),
        ctx.db.select({ count: count() }).from(professorTable),
        ctx.db.select({ count: count() }).from(userTable).where(eq(userTable.role, UserRole.STUDENT)),
        ctx.db
          .select({ count: count() })
          .from(professorInvitationTable)
          .where(eq(professorInvitationTable.status, 'PENDING')),
      ])

      const projectsByStatus = projectsByStatusResult.reduce(
        (acc, curr) => {
          acc[curr.status] = curr.count
          return acc
        },
        {} as Record<string, number>
      )

      const approvedProjects = await ctx.db
        .select({
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
        })
        .from(projetoTable)
        .where(eq(projetoTable.status, ProjetoStatus.APPROVED))

      const totalScholarships = approvedProjects.reduce(
        (sum, project) => sum + (project.bolsasDisponibilizadas || 0),
        0
      )

      return {
        totalProjects: totalProjectsResult[0]?.count || 0,
        projectsByStatus,
        totalProfessors: totalProfessorsResult[0]?.count || 0,
        totalStudents: totalStudentsResult[0]?.count || 0,
        pendingInvitations: pendingInvitationsResult[0]?.count || 0,
        totalScholarships,
        occupiedScholarships: 0,
      }
    }),

  sendBulkReminder: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/bulk-reminder',
        tags: ['admin', 'notifications'],
        summary: 'Send bulk reminder',
        description: 'Send reminder emails to multiple recipients',
      },
    })
    .input(
      z.object({
        adminUserId: z.number(),
        recipientIds: z.array(z.number()),
        subject: z.string(),
        message: z.string(),
        tipoNotificacao: z.nativeEnum(TipoNotificacao),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        sentCount: z.number(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const recipients = await ctx.db
          .select({
            id: userTable.id,
            email: userTable.email,
            username: userTable.username,
          })
          .from(userTable)
          .where(inArray(userTable.id, input.recipientIds))

        let sentCount = 0
        for (const recipient of recipients) {
          try {
            console.log(`Sending reminder to ${recipient.email}: ${input.subject}`)
            sentCount++
          } catch (error) {
            console.error(`Failed to send email to ${recipient.email}:`, error)
          }
        }

        return {
          success: true,
          sentCount,
        }
      } catch (error) {
        console.error('Error sending bulk reminder:', error)
        return {
          success: false,
          sentCount: 0,
          error: 'Failed to send bulk reminder',
        }
      }
    }),

  importProjectsFromXlsx: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/projects/import-xlsx',
        tags: ['admin', 'projects'],
        summary: 'Import projects from XLSX',
        description: 'Import project data from an XLSX file and create projects in bulk.',
      },
    })
    .input(
      z.object({
        file: z.string(), // base64 encoded file
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        createdCount: z.number(),
        errors: z.array(z.object({ row: z.number(), error: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const errors: { row: number; error: string }[] = []
      let createdCount = 0

      try {
        const buffer = Buffer.from(input.file, 'base64')
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet) as any[]

        for (const [index, row] of data.entries()) {
          const rowIndex = index + 2 // 1-based index + header row

          // Basic validation
          const requiredFields = [
            'titulo',
            'professor_siape',
            'departamento_sigla',
            'disciplina_codigo',
            'tipo_proposicao',
            'carga_horaria_semanal',
            'numero_semanas',
            'publico_alvo',
          ]
          const missingFields = requiredFields.filter((field) => !row[field])

          if (missingFields.length > 0) {
            errors.push({ row: rowIndex, error: `Missing required fields: ${missingFields.join(', ')}` })
            continue
          }

          try {
            await ctx.db.transaction(async (tx) => {
              // Find professor by SIAPE
              const professor = await tx.query.professorTable.findFirst({
                where: eq(professorTable.matriculaSiape, row.professor_siape),
              })
              if (!professor) throw new Error(`Professor with SIAPE ${row.professor_siape} not found`)

              // Find department by acronym
              const departamento = await tx.query.departamentoTable.findFirst({
                where: eq(departamentoTable.sigla, row.departamento_sigla),
              })
              if (!departamento) throw new Error(`Department with sigla ${row.departamento_sigla} not found`)

              // Find discipline by code
              const disciplina = await tx.query.disciplinaTable.findFirst({
                where: eq(disciplinaTable.codigo, row.disciplina_codigo),
              })
              if (!disciplina) throw new Error(`Disciplina with code ${row.disciplina_codigo} not found`)

              const [project] = await tx
                .insert(projetoTable)
                .values({
                  titulo: row.titulo,
                  descricao: row.descricao || 'Descrição não fornecida.',
                  ano: row.ano || new Date().getFullYear(),
                  semestre: row.semestre || Semestre.SEMESTRE_1,
                  status: ProjetoStatus.PENDING_PROFESSOR_SIGNATURE, // Needs professor signature
                  professorResponsavelId: professor.id,
                  departamentoId: departamento.id,
                  bolsasSolicitadas: row.bolsas_solicitadas || 0,
                  voluntariosSolicitados: row.voluntarios_solicitados || 0,
                  tipoProposicao: row.tipo_proposicao,
                  cargaHorariaSemana: row.carga_horaria_semanal,
                  numeroSemanas: row.numero_semanas,
                  publicoAlvo: row.publico_alvo,
                })
                .returning()

              // Associate discipline
              await tx.insert(projetoDisciplinaTable).values({
                projetoId: project.id,
                disciplinaId: disciplina.id,
              })

              createdCount++
            })
          } catch (e: any) {
            errors.push({ row: rowIndex, error: e.message })
          }
        }
      } catch (e: any) {
        return { success: false, createdCount: 0, errors: [{ row: 0, error: `Failed to parse file: ${e.message}` }] }
      }

      return { success: errors.length === 0, createdCount, errors }
    }),

  // Template endpoints
  listProjectTemplates: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/project-templates',
        tags: ['admin', 'templates'],
        summary: 'List project templates',
        description: 'Get all project templates with discipline information',
      },
    })
    .input(z.void())
    .output(
      z.array(
        z.object({
          id: z.number(),
          disciplinaId: z.number(),
          disciplina: z.object({
            id: z.number(),
            nome: z.string(),
            codigo: z.string(),
          }),
          tituloDefault: z.string().nullable(),
          descricaoDefault: z.string().nullable(),
          cargaHorariaSemanaDefault: z.number().nullable(),
          numeroSemanasDefault: z.number().nullable(),
          publicoAlvoDefault: z.string().nullable(),
          atividadesDefault: z.string().nullable(),
          criadoPor: z.object({
            id: z.number(),
            username: z.string(),
          }),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const templates = await ctx.db
        .select({
          id: projetoTemplateTable.id,
          disciplinaId: projetoTemplateTable.disciplinaId,
          tituloDefault: projetoTemplateTable.tituloDefault,
          descricaoDefault: projetoTemplateTable.descricaoDefault,
          cargaHorariaSemanaDefault: projetoTemplateTable.cargaHorariaSemanaDefault,
          numeroSemanasDefault: projetoTemplateTable.numeroSemanasDefault,
          publicoAlvoDefault: projetoTemplateTable.publicoAlvoDefault,
          atividadesDefault: projetoTemplateTable.atividadesDefault,
          createdAt: projetoTemplateTable.createdAt,
          updatedAt: projetoTemplateTable.updatedAt,
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
          criadoPor: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(projetoTemplateTable)
        .innerJoin(disciplinaTable, eq(projetoTemplateTable.disciplinaId, disciplinaTable.id))
        .innerJoin(userTable, eq(projetoTemplateTable.criadoPorUserId, userTable.id))

      return templates
    }),

  createProjectTemplate: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/project-templates',
        tags: ['admin', 'templates'],
        summary: 'Create project template',
        description: 'Create a new project template for a discipline',
      },
    })
    .input(
      z.object({
        disciplinaId: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().optional(),
        numeroSemanasDefault: z.number().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.string().optional(),
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        templateId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if template already exists for this discipline
        const existingTemplate = await ctx.db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.disciplinaId, input.disciplinaId),
        })

        if (existingTemplate) {
          return {
            success: false,
            error: 'Template already exists for this discipline',
          }
        }

        // Check if discipline exists
        const discipline = await ctx.db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.id, input.disciplinaId),
        })

        if (!discipline) {
          return {
            success: false,
            error: 'Discipline not found',
          }
        }

        const [template] = await ctx.db
          .insert(projetoTemplateTable)
          .values({
            disciplinaId: input.disciplinaId,
            tituloDefault: input.tituloDefault,
            descricaoDefault: input.descricaoDefault,
            cargaHorariaSemanaDefault: input.cargaHorariaSemanaDefault,
            numeroSemanasDefault: input.numeroSemanasDefault,
            publicoAlvoDefault: input.publicoAlvoDefault,
            atividadesDefault: input.atividadesDefault,
            criadoPorUserId: input.adminUserId,
          })
          .returning()

        return {
          success: true,
          templateId: template.id,
        }
      } catch (error) {
        console.error('Error creating project template:', error)
        return {
          success: false,
          error: 'Failed to create project template',
        }
      }
    }),

  getProjectTemplate: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/project-templates/{id}',
        tags: ['admin', 'templates'],
        summary: 'Get project template',
        description: 'Get a specific project template by ID',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          disciplinaId: z.number(),
          disciplina: z.object({
            id: z.number(),
            nome: z.string(),
            codigo: z.string(),
          }),
          tituloDefault: z.string().nullable(),
          descricaoDefault: z.string().nullable(),
          cargaHorariaSemanaDefault: z.number().nullable(),
          numeroSemanasDefault: z.number().nullable(),
          publicoAlvoDefault: z.string().nullable(),
          atividadesDefault: z.string().nullable(),
          criadoPor: z.object({
            id: z.number(),
            username: z.string(),
          }),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.db
        .select({
          id: projetoTemplateTable.id,
          disciplinaId: projetoTemplateTable.disciplinaId,
          tituloDefault: projetoTemplateTable.tituloDefault,
          descricaoDefault: projetoTemplateTable.descricaoDefault,
          cargaHorariaSemanaDefault: projetoTemplateTable.cargaHorariaSemanaDefault,
          numeroSemanasDefault: projetoTemplateTable.numeroSemanasDefault,
          publicoAlvoDefault: projetoTemplateTable.publicoAlvoDefault,
          atividadesDefault: projetoTemplateTable.atividadesDefault,
          createdAt: projetoTemplateTable.createdAt,
          updatedAt: projetoTemplateTable.updatedAt,
          disciplina: {
            id: disciplinaTable.id,
            nome: disciplinaTable.nome,
            codigo: disciplinaTable.codigo,
          },
          criadoPor: {
            id: userTable.id,
            username: userTable.username,
          },
        })
        .from(projetoTemplateTable)
        .innerJoin(disciplinaTable, eq(projetoTemplateTable.disciplinaId, disciplinaTable.id))
        .innerJoin(userTable, eq(projetoTemplateTable.criadoPorUserId, userTable.id))
        .where(eq(projetoTemplateTable.id, input.id))
        .limit(1)

      return template[0] || null
    }),

  updateProjectTemplate: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/admin/project-templates/{id}',
        tags: ['admin', 'templates'],
        summary: 'Update project template',
        description: 'Update an existing project template',
      },
    })
    .input(
      z.object({
        id: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().optional(),
        numeroSemanasDefault: z.number().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.string().optional(),
        adminUserId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await ctx.db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.id, input.id),
        })

        if (!template) {
          return {
            success: false,
            error: 'Template not found',
          }
        }

        await ctx.db
          .update(projetoTemplateTable)
          .set({
            tituloDefault: input.tituloDefault,
            descricaoDefault: input.descricaoDefault,
            cargaHorariaSemanaDefault: input.cargaHorariaSemanaDefault,
            numeroSemanasDefault: input.numeroSemanasDefault,
            publicoAlvoDefault: input.publicoAlvoDefault,
            atividadesDefault: input.atividadesDefault,
            ultimaAtualizacaoUserId: input.adminUserId,
            updatedAt: new Date(),
          })
          .where(eq(projetoTemplateTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error updating project template:', error)
        return {
          success: false,
          error: 'Failed to update project template',
        }
      }
    }),

  deleteProjectTemplate: publicProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/admin/project-templates/{id}',
        tags: ['admin', 'templates'],
        summary: 'Delete project template',
        description: 'Delete a project template',
      },
    })
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await ctx.db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.id, input.id),
        })

        if (!template) {
          return {
            success: false,
            error: 'Template not found',
          }
        }

        await ctx.db.delete(projetoTemplateTable).where(eq(projetoTemplateTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error('Error deleting project template:', error)
        return {
          success: false,
          error: 'Failed to delete project template',
        }
      }
    }),
})
