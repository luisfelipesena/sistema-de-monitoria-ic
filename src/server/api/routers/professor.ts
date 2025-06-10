import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  atividadeProjetoTable,
  departamentoTable,
  disciplinaTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
} from '@/server/db/schema'
import { generatePdfBuffer } from '@/server/lib/pdf-generation/generatePdf'
import { ProjectPDF } from '@/server/lib/pdf-generation/ProjectPDF'
import { ProjetoStatus, Semestre, TipoProposicao, UserRole } from '@/types/enums'
import { and, eq, type SQLWrapper } from 'drizzle-orm'
import { z } from 'zod'

// Define the output schema for project lists to ensure type consistency
const projectOutputSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descricao: z.string(),
  ano: z.number(),
  semestre: z.nativeEnum(Semestre),
  status: z.nativeEnum(ProjetoStatus),
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

export const professorRouter = createTRPCRouter({
  // Get professor profile
  getProfile: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professor/profile/{userId}',
        tags: ['professor', 'profile'],
        summary: 'Get professor profile',
        description: 'Retrieve professor profile by user ID',
      },
    })
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          nomeCompleto: z.string(),
          emailInstitucional: z.string(),
          telefone: z.string().nullable(),
          telefoneInstitucional: z.string().nullable(),
          regime: z.string(),
          matriculaSiape: z.string().nullable(),
          departamento: z.object({
            id: z.number(),
            nome: z.string(),
            sigla: z.string().nullable(),
          }),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const professor = await ctx.db.query.professorTable.findFirst({
        where: eq(professorTable.userId, input.userId),
        with: {
          departamento: true,
        },
      })

      if (!professor) {
        return null
      }

      return {
        id: professor.id,
        nomeCompleto: professor.nomeCompleto,
        emailInstitucional: professor.emailInstitucional,
        telefone: professor.telefone,
        telefoneInstitucional: professor.telefoneInstitucional,
        regime: professor.regime,
        matriculaSiape: professor.matriculaSiape,
        departamento: professor.departamento,
      }
    }),

  // Update professor profile
  updateProfile: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/professor/profile/{userId}',
        tags: ['professor', 'profile'],
        summary: 'Update professor profile',
        description: 'Update professor profile information',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string().optional(),
        emailInstitucional: z.string().email().optional(),
        telefone: z.string().optional(),
        telefoneInstitucional: z.string().optional(),
        regime: z.string().optional(),
        matriculaSiape: z.string().optional(),
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
        const { userId, ...updateData } = input

        // Remove undefined fields
        const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined))

        if (Object.keys(cleanedData).length === 0) {
          return {
            success: false,
            error: 'No data provided for update',
          }
        }

        await ctx.db.update(professorTable).set(cleanedData).where(eq(professorTable.userId, userId))

        return { success: true }
      } catch (error) {
        console.error('Error updating professor profile:', error)
        return {
          success: false,
          error: 'Failed to update professor profile',
        }
      }
    }),

  // Get projects for a professor
  getProjects: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professor/projects',
        tags: ['professor', 'projects'],
        summary: 'Get professor projects',
        description: 'Retrieve all projects created by or associated with the professor',
      },
    })
    .input(
      z.object({
        professorId: z.number(),
        ano: z.number().optional(),
        semestre: z.nativeEnum(Semestre).optional(),
        status: z.nativeEnum(ProjetoStatus).optional(),
      })
    )
    .output(z.array(projectOutputSchema))
    .query(async ({ ctx, input }) => {
      // Build query filters based on input
      const conditions: SQLWrapper[] = [eq(projetoTable.professorResponsavelId, input.professorId)]

      // Add optional filters
      if (input.ano) {
        conditions.push(eq(projetoTable.ano, input.ano))
      }

      if (input.semestre) {
        conditions.push(eq(projetoTable.semestre, input.semestre))
      }

      if (input.status) {
        conditions.push(eq(projetoTable.status, input.status))
      }

      const projects = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          descricao: projetoTable.descricao,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          status: projetoTable.status,
          bolsasSolicitadas: projetoTable.bolsasSolicitadas,
          bolsasDisponibilizadas: projetoTable.bolsasDisponibilizadas,
          voluntariosSolicitados: projetoTable.voluntariosSolicitados,
          createdAt: projetoTable.createdAt,
          updatedAt: projetoTable.updatedAt,
          departamento: {
            id: departamentoTable.id,
            nome: departamentoTable.nome,
            sigla: departamentoTable.sigla,
          },
        })
        .from(projetoTable)
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(and(...conditions))

      // Convert DB types to expected output types
      return projects.map((project) => ({
        ...project,
        semestre: project.semestre as Semestre,
        status: project.status as ProjetoStatus,
      }))
    }),

  // Get a specific project
  getProject: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professor/projects/{id}',
        tags: ['professor', 'projects'],
        summary: 'Get project details',
        description: 'Retrieve detailed information about a specific project',
      },
    })
    .input(
      z.object({
        id: z.number(),
        professorId: z.number(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        titulo: z.string(),
        descricao: z.string(),
        ano: z.number(),
        semestre: z.nativeEnum(Semestre),
        tipoProposicao: z.nativeEnum(TipoProposicao),
        bolsasSolicitadas: z.number(),
        bolsasDisponibilizadas: z.number().nullable(),
        voluntariosSolicitados: z.number(),
        cargaHorariaSemana: z.number(),
        numeroSemanas: z.number(),
        publicoAlvo: z.string(),
        estimativaPessoasBenificiadas: z.number().nullable(),
        status: z.nativeEnum(ProjetoStatus),
        assinaturaProfessor: z.string().nullable(),
        feedbackAdmin: z.string().nullable(),
        departamento: z.object({
          id: z.number(),
          nome: z.string(),
          sigla: z.string().nullable(),
        }),
        disciplinas: z.array(
          z.object({
            id: z.number(),
            nome: z.string(),
            codigo: z.string(),
          })
        ),
        atividades: z.array(
          z.object({
            id: z.number(),
            descricao: z.string(),
          })
        ),
        professorParticipantes: z.array(
          z.object({
            id: z.number(),
            nomeCompleto: z.string(),
          })
        ),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get the basic project data
      const [project] = await ctx.db
        .select()
        .from(projetoTable)
        .where(and(eq(projetoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
        .limit(1)

      if (!project) {
        throw new Error('Project not found or you do not have access to it')
      }

      // Get the department data
      const [departamento] = await ctx.db
        .select()
        .from(departamentoTable)
        .where(eq(departamentoTable.id, project.departamentoId))
        .limit(1)

      // Get disciplines associated with this project
      const projetoDisciplinas = await ctx.db
        .select({
          disciplina: disciplinaTable,
        })
        .from(projetoDisciplinaTable)
        .innerJoin(disciplinaTable, eq(projetoDisciplinaTable.disciplinaId, disciplinaTable.id))
        .where(eq(projetoDisciplinaTable.projetoId, project.id))

      // Get activities associated with this project
      const atividades = await ctx.db
        .select()
        .from(atividadeProjetoTable)
        .where(eq(atividadeProjetoTable.projetoId, project.id))

      // Get participating professors
      const professorParticipantes = await ctx.db
        .select({
          professor: professorTable,
        })
        .from(projetoProfessorParticipanteTable)
        .innerJoin(professorTable, eq(projetoProfessorParticipanteTable.professorId, professorTable.id))
        .where(eq(projetoProfessorParticipanteTable.projetoId, project.id))

      return {
        id: project.id,
        titulo: project.titulo,
        descricao: project.descricao,
        ano: project.ano,
        semestre: project.semestre as Semestre,
        tipoProposicao: project.tipoProposicao as TipoProposicao,
        bolsasSolicitadas: project.bolsasSolicitadas,
        bolsasDisponibilizadas: project.bolsasDisponibilizadas,
        voluntariosSolicitados: project.voluntariosSolicitados,
        cargaHorariaSemana: project.cargaHorariaSemana,
        numeroSemanas: project.numeroSemanas,
        publicoAlvo: project.publicoAlvo,
        estimativaPessoasBenificiadas: project.estimativaPessoasBenificiadas,
        status: project.status as ProjetoStatus,
        assinaturaProfessor: project.assinaturaProfessor,
        feedbackAdmin: project.feedbackAdmin,
        departamento: {
          id: departamento.id,
          nome: departamento.nome,
          sigla: departamento.sigla,
        },
        disciplinas: projetoDisciplinas.map((pd) => ({
          id: pd.disciplina.id,
          nome: pd.disciplina.nome,
          codigo: pd.disciplina.codigo,
        })),
        atividades: atividades.map((a) => ({
          id: a.id,
          descricao: a.descricao,
        })),
        professorParticipantes: professorParticipantes.map((pp) => ({
          id: pp.professor.id,
          nomeCompleto: pp.professor.nomeCompleto,
        })),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    }),

  // Get project as PDF
  getProjectAsPdf: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professor/projects/{id}/pdf',
        tags: ['professor', 'projects'],
        summary: 'Get project as PDF',
        description: 'Retrieve a project proposal as a PDF file',
      },
    })
    .input(z.object({ id: z.number(), professorId: z.number() }))
    .output(z.object({ pdf: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch project data using the same logic as get
      const [projectData] = await ctx.db
        .select()
        .from(projetoTable)
        .where(and(eq(projetoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
        .limit(1)

      if (!projectData) {
        throw new Error('Project not found')
      }

      const [departamento] = await ctx.db
        .select()
        .from(departamentoTable)
        .where(eq(departamentoTable.id, projectData.departamentoId))
        .limit(1)

      const [professorResponsavel] = await ctx.db
        .select()
        .from(professorTable)
        .where(eq(professorTable.id, projectData.professorResponsavelId))
        .limit(1)

      const projetoDisciplinas = await ctx.db
        .select({ disciplina: disciplinaTable })
        .from(projetoDisciplinaTable)
        .innerJoin(disciplinaTable, eq(projetoDisciplinaTable.disciplinaId, disciplinaTable.id))
        .where(eq(projetoDisciplinaTable.projetoId, projectData.id))

      const atividades = await ctx.db
        .select()
        .from(atividadeProjetoTable)
        .where(eq(atividadeProjetoTable.projetoId, projectData.id))

      const fullProjectData = {
        ...projectData,
        departamento,
        professorResponsavel,
        disciplinas: projetoDisciplinas.map((pd) => pd.disciplina),
        atividades,
      }

      // Generate PDF
      const pdfComponent = ProjectPDF({ project: fullProjectData })
      const pdfBuffer = await generatePdfBuffer(pdfComponent)

      return {
        pdf: pdfBuffer.toString('base64'),
      }
    }),

  // Create a new project
  createProject: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/professor/projects',
        tags: ['professor', 'projects'],
        summary: 'Create a new project',
        description: 'Create a new monitoring project proposal',
      },
    })
    .input(
      z.object({
        professorId: z.number(),
        departamentoId: z.number(),
        ano: z.number(),
        semestre: z.nativeEnum(Semestre),
        tipoProposicao: z.nativeEnum(TipoProposicao),
        bolsasSolicitadas: z.number().min(0),
        voluntariosSolicitados: z.number().min(0),
        cargaHorariaSemana: z.number().min(1),
        numeroSemanas: z.number().min(1),
        publicoAlvo: z.string(),
        estimativaPessoasBenificiadas: z.number().optional(),
        titulo: z.string(),
        descricao: z.string(),
        disciplinasIds: z.array(z.number()),
        atividades: z.array(z.string()),
        professorParticipantesIds: z.array(z.number()).optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        status: z.nativeEnum(ProjetoStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Start a transaction for creating the project and related entities
      return await ctx.db.transaction(async (tx) => {
        // Create the basic project
        const [project] = await tx
          .insert(projetoTable)
          .values({
            departamentoId: input.departamentoId,
            ano: input.ano,
            semestre: input.semestre,
            tipoProposicao: input.tipoProposicao,
            bolsasSolicitadas: input.bolsasSolicitadas,
            voluntariosSolicitados: input.voluntariosSolicitados,
            cargaHorariaSemana: input.cargaHorariaSemana,
            numeroSemanas: input.numeroSemanas,
            publicoAlvo: input.publicoAlvo,
            estimativaPessoasBenificiadas: input.estimativaPessoasBenificiadas,
            professorResponsavelId: input.professorId,
            titulo: input.titulo,
            descricao: input.descricao,
            status: ProjetoStatus.DRAFT,
          })
          .returning()

        // Associate disciplines with the project
        if (input.disciplinasIds.length > 0) {
          await tx.insert(projetoDisciplinaTable).values(
            input.disciplinasIds.map((disciplinaId) => ({
              projetoId: project.id,
              disciplinaId,
            }))
          )
        }

        // Create activities for the project
        if (input.atividades.length > 0) {
          await tx.insert(atividadeProjetoTable).values(
            input.atividades.map((descricao) => ({
              projetoId: project.id,
              descricao,
            }))
          )
        }

        // Associate participating professors with the project
        if (input.professorParticipantesIds && input.professorParticipantesIds.length > 0) {
          await tx.insert(projetoProfessorParticipanteTable).values(
            input.professorParticipantesIds.map((professorId) => ({
              projetoId: project.id,
              professorId,
            }))
          )
        }

        return {
          id: project.id,
          status: project.status as ProjetoStatus,
        }
      })
    }),

  // Update an existing project
  updateProject: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/professor/projects/{id}',
        tags: ['professor', 'projects'],
        summary: 'Update a project',
        description: 'Update an existing monitoring project proposal',
      },
    })
    .input(
      z.object({
        id: z.number(),
        professorId: z.number(),
        departamentoId: z.number().optional(),
        bolsasSolicitadas: z.number().min(0).optional(),
        voluntariosSolicitados: z.number().min(0).optional(),
        cargaHorariaSemana: z.number().min(1).optional(),
        numeroSemanas: z.number().min(1).optional(),
        publicoAlvo: z.string().optional(),
        estimativaPessoasBenificiadas: z.number().optional(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        disciplinasIds: z.array(z.number()).optional(),
        atividades: z
          .array(
            z.object({
              id: z.number().optional(),
              descricao: z.string(),
            })
          )
          .optional(),
        professorParticipantesIds: z.array(z.number()).optional(),
      })
    )
    .output(
      z.object({
        id: z.number(),
        status: z.nativeEnum(ProjetoStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Check if project exists and belongs to the professor
        const [existingProject] = await tx
          .select()
          .from(projetoTable)
          .where(and(eq(projetoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
          .limit(1)

        if (!existingProject) {
          throw new Error('Project not found or you do not have access to it')
        }

        // Only allow editing if project is in DRAFT or REJECTED status
        if (existingProject.status !== ProjetoStatus.DRAFT && existingProject.status !== ProjetoStatus.REJECTED) {
          throw new Error('Project cannot be edited in its current status')
        }

        // Update the project basic data
        const updateData: Record<string, unknown> = {}

        if (input.departamentoId) updateData.departamentoId = input.departamentoId
        if (input.bolsasSolicitadas !== undefined) updateData.bolsasSolicitadas = input.bolsasSolicitadas
        if (input.voluntariosSolicitados !== undefined) updateData.voluntariosSolicitados = input.voluntariosSolicitados
        if (input.cargaHorariaSemana) updateData.cargaHorariaSemana = input.cargaHorariaSemana
        if (input.numeroSemanas) updateData.numeroSemanas = input.numeroSemanas
        if (input.publicoAlvo) updateData.publicoAlvo = input.publicoAlvo
        if (input.estimativaPessoasBenificiadas !== undefined)
          updateData.estimativaPessoasBenificiadas = input.estimativaPessoasBenificiadas
        if (input.titulo) updateData.titulo = input.titulo
        if (input.descricao) updateData.descricao = input.descricao

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await tx.update(projetoTable).set(updateData).where(eq(projetoTable.id, input.id))
        }

        // Update disciplines if provided
        if (input.disciplinasIds) {
          // Delete existing associations
          await tx.delete(projetoDisciplinaTable).where(eq(projetoDisciplinaTable.projetoId, input.id))

          // Add new associations
          if (input.disciplinasIds.length > 0) {
            await tx.insert(projetoDisciplinaTable).values(
              input.disciplinasIds.map((disciplinaId) => ({
                projetoId: input.id,
                disciplinaId,
              }))
            )
          }
        }

        // Update activities if provided
        if (input.atividades) {
          // Delete existing activities
          await tx.delete(atividadeProjetoTable).where(eq(atividadeProjetoTable.projetoId, input.id))

          // Add new activities
          if (input.atividades.length > 0) {
            await tx.insert(atividadeProjetoTable).values(
              input.atividades.map((atividade) => ({
                projetoId: input.id,
                descricao: atividade.descricao,
              }))
            )
          }
        }

        // Update participating professors if provided
        if (input.professorParticipantesIds) {
          // Delete existing associations
          await tx
            .delete(projetoProfessorParticipanteTable)
            .where(eq(projetoProfessorParticipanteTable.projetoId, input.id))

          // Add new associations
          if (input.professorParticipantesIds.length > 0) {
            await tx.insert(projetoProfessorParticipanteTable).values(
              input.professorParticipantesIds.map((professorId) => ({
                projetoId: input.id,
                professorId,
              }))
            )
          }
        }

        return {
          id: input.id,
          status: existingProject.status as ProjetoStatus,
        }
      })
    }),

  // Submit a project for admin approval
  submitProject: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/professor/projects/{id}/submit',
        tags: ['professor', 'projects'],
        summary: 'Submit project for approval',
        description: 'Submit a project for administrative approval',
      },
    })
    .input(
      z.object({
        id: z.number(),
        professorId: z.number(),
        assinatura: z.string(), // Base64 image of signature
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        id: z.number(),
        status: z.nativeEnum(ProjetoStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if project exists and belongs to the professor
      const [project] = await ctx.db
        .select()
        .from(projetoTable)
        .where(and(eq(projetoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
        .limit(1)

      if (!project) {
        throw new Error('Project not found or you do not have access to it')
      }

      // Only allow submission if project is in DRAFT or REJECTED status
      if (project.status !== ProjetoStatus.DRAFT && project.status !== ProjetoStatus.REJECTED) {
        throw new Error('Project cannot be submitted in its current status')
      }

      // Update project status and save signature
      const [updatedProject] = await ctx.db
        .update(projetoTable)
        .set({
          status: ProjetoStatus.SUBMITTED,
          assinaturaProfessor: input.assinatura,
        })
        .where(eq(projetoTable.id, input.id))
        .returning()

      return {
        success: true,
        id: updatedProject.id,
        status: updatedProject.status as ProjetoStatus,
      }
    }),

  // Get available disciplines for a department
  getDisciplines: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professor/disciplines',
        tags: ['professor', 'disciplines'],
        summary: 'Get available disciplines',
        description: 'Get the list of disciplines available for a department',
      },
    })
    .input(
      z.object({
        departamentoId: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          nome: z.string(),
          codigo: z.string(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const disciplines = await ctx.db
        .select({
          id: disciplinaTable.id,
          nome: disciplinaTable.nome,
          codigo: disciplinaTable.codigo,
        })
        .from(disciplinaTable)
        .where(eq(disciplinaTable.departamentoId, input.departamentoId))
        .orderBy(disciplinaTable.nome)

      return disciplines
    }),

  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/professores',
        tags: ['professors'],
        summary: 'List all professors',
        description: 'Get all professors with detailed information for admin view',
      },
    })
    .input(
      z.object({
        search: z.string().optional(),
        departamentoId: z.number().optional(),
        regime: z.string().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          userId: z.number(),
          nomeCompleto: z.string(),
          emailInstitucional: z.string(),
          telefone: z.string().nullable(),
          telefoneInstitucional: z.string().nullable(),
          regime: z.string(),
          matriculaSiape: z.string().nullable(),
          departamento: z.object({
            id: z.number(),
            nome: z.string(),
            sigla: z.string().nullable(),
          }),
          user: z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
            role: z.nativeEnum(UserRole),
            isActive: z.boolean(),
          }),
          totalProjetos: z.number(),
          projetosAtivos: z.number(),
        })
      )
    )
    .query(async ({ ctx }) => {
      const professores = await ctx.db.query.professorTable.findMany({
        with: {
          departamento: true,
          user: true,
        },
      })

      const allProjects = await ctx.db.query.projetoTable.findMany({
        columns: {
          id: true,
          status: true,
          professorResponsavelId: true,
        },
      })

      const projectsByProfessor = allProjects.reduce(
        (acc, proj) => {
          if (!proj.professorResponsavelId) return acc
          if (!acc[proj.professorResponsavelId]) {
            acc[proj.professorResponsavelId] = []
          }
          acc[proj.professorResponsavelId].push(proj)
          return acc
        },
        {} as Record<number, typeof allProjects>
      )

      return professores.map((p) => {
        const professorProjects = projectsByProfessor[p.id] || []
        return {
          ...p,
          departamento: p.departamento,
          user: {
            ...p.user,
            role: p.user.role as UserRole,
            isActive: true, // Mocking this as the schema doesn't contain it
          },
          regime: p.regime,
          totalProjetos: professorProjects.length,
          projetosAtivos: professorProjects.filter((proj) => proj.status === ProjetoStatus.APPROVED).length,
        }
      })
    }),

  update: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/professores/{professorId}',
        tags: ['professors'],
        summary: 'Update professor details',
        description: 'Update a professor by their ID',
      },
    })
    .input(
      z.object({
        professorId: z.number(),
        nomeCompleto: z.string(),
        emailInstitucional: z.string().email(),
        telefone: z.string(),
        telefoneInstitucional: z.string(),
        departamentoId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(professorTable)
        .set({
          nomeCompleto: input.nomeCompleto,
          emailInstitucional: input.emailInstitucional,
          telefone: input.telefone,
          telefoneInstitucional: input.telefoneInstitucional,
          departamentoId: input.departamentoId,
        })
        .where(eq(professorTable.id, input.professorId))
      return { success: true }
    }),
})
