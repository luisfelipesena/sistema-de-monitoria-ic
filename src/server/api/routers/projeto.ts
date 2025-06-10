import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { departamentoTable, notificationTable, professorTable, projetoTable } from "@/server/db/schema"
import { ProjetoStatus, TipoNotificacao } from "@/types/enums"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"

export const projetoRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: eq(projetoTable.id, input.id),
      with: {
        disciplinas: { with: { disciplina: true } },
        professorResponsavel: { with: { user: true } },
        departamento: true,
      },
    })
    return projeto
  }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.array(z.string()).optional(),
        professorId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, professorId } = input
      const user = ctx.user

      const whereClauses = []
      if (status && status.length > 0) {
        whereClauses.push(inArray(projetoTable.status, status as any))
      }

      if (user.role === "professor") {
        const professor = await ctx.db.query.professorTable.findFirst({
          where: eq(professorTable.userId, user.id),
        })
        if (professor) {
          whereClauses.push(eq(projetoTable.professorResponsavelId, professor.id))
        }
      } else if (professorId) {
        whereClauses.push(eq(projetoTable.professorResponsavelId, professorId))
      }

      const projetos = await ctx.db
        .select({
          id: projetoTable.id,
          titulo: projetoTable.titulo,
          status: projetoTable.status,
          ano: projetoTable.ano,
          semestre: projetoTable.semestre,
          departamentoNome: departamentoTable.nome,
          professorResponsavelNome: professorTable.nomeCompleto,
          bolsas: projetoTable.bolsasSolicitadas,
          voluntarios: projetoTable.voluntariosSolicitados,
          cargaHoraria: projetoTable.cargaHorariaSemana,
          requisitos: projetoTable.publicoAlvo,
        })
        .from(projetoTable)
        .leftJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .leftJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .where(and(...whereClauses))

      return projetos
    }),

  assinarProjetoProfessor: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        signatureImage: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(projetoTable)
        .set({
          assinaturaProfessor: input.signatureImage,
          status: "SUBMITTED",
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      return { success: true }
    }),

  assinarProjetoAdmin: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        signatureImage: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(projetoTable)
        .set({
          status: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(projetoTable.id, input.projetoId))

      return { success: true }
    }),

  getProjectPdfData: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const projeto = await ctx.db.query.projetoTable.findFirst({
      where: eq(projetoTable.id, input.id),
      columns: {
        assinaturaProfessor: true,
      },
    })

    return {
      ...projeto,
      dataAssinaturaProfessor: projeto?.assinaturaProfessor ? new Date().toLocaleDateString("pt-BR") : undefined,
      assinaturaAdmin: undefined,
      dataAssinaturaAdmin: undefined,
    }
  }),

  submitProject: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projeto/{id}/submit',
        tags: ['projeto'],
        summary: 'Submit project for review',
        description: 'Submit a project for administrative review',
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
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify project belongs to professor
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: and(
            eq(projetoTable.id, input.id),
            eq(projetoTable.professorResponsavelId, input.professorId)
          ),
        })

        if (!projeto) {
          return {
            success: false,
            error: "Project not found or access denied",
          }
        }

        if (projeto.status !== ProjetoStatus.DRAFT) {
          return {
            success: false,
            error: "Project can only be submitted from draft status",
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            status: ProjetoStatus.SUBMITTED,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        // Create notification for admin
        await ctx.db.insert(notificationTable).values({
          userId: 1, // Admin user - should be dynamic
          tipo: TipoNotificacao.PROJETO_SUBMETIDO,
          titulo: "Novo Projeto Submetido",
          mensagem: `O projeto "${projeto.titulo}" foi submetido para análise.`,
          metadata: JSON.stringify({ projetoId: input.id }),
          lida: false,
        })

        return { success: true }
      } catch (error) {
        console.error("Error submitting project:", error)
        return {
          success: false,
          error: "Failed to submit project",
        }
      }
    }),

  approveProject: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projeto/{id}/approve',
        tags: ['projeto'],
        summary: 'Approve project',
        description: 'Approve a submitted project',
      },
    })
    .input(
      z.object({
        id: z.number(),
        adminUserId: z.number(),
        bolsasDisponibilizadas: z.number().optional(),
        observacoes: z.string().optional(),
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
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
          with: {
            professorResponsavel: { with: { user: true } },
          },
        })

        if (!projeto) {
          return {
            success: false,
            error: "Project not found",
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            status: ProjetoStatus.APPROVED,
            bolsasDisponibilizadas: input.bolsasDisponibilizadas || projeto.bolsasSolicitadas,
            observacoesAdmin: input.observacoes,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        // Notify professor
        await ctx.db.insert(notificationTable).values({
          userId: projeto.professorResponsavel.userId,
          tipo: TipoNotificacao.PROJETO_APROVADO,
          titulo: "Projeto Aprovado",
          mensagem: `Seu projeto "${projeto.titulo}" foi aprovado! ${input.observacoes ? `Observações: ${input.observacoes}` : ""}`,
          metadata: JSON.stringify({ projetoId: input.id }),
          lida: false,
        })

        return { success: true }
      } catch (error) {
        console.error("Error approving project:", error)
        return {
          success: false,
          error: "Failed to approve project",
        }
      }
    }),

  rejectProject: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projeto/{id}/reject',
        tags: ['projeto'],
        summary: 'Reject project',
        description: 'Reject a submitted project',
      },
    })
    .input(
      z.object({
        id: z.number(),
        adminUserId: z.number(),
        motivo: z.string(),
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
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
          with: {
            professorResponsavel: { with: { user: true } },
          },
        })

        if (!projeto) {
          return {
            success: false,
            error: "Project not found",
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            status: ProjetoStatus.REJECTED,
            observacoesAdmin: input.motivo,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        // Notify professor
        await ctx.db.insert(notificationTable).values({
          userId: projeto.professorResponsavel.userId,
          tipo: TipoNotificacao.PROJETO_REJEITADO,
          titulo: "Projeto Rejeitado",
          mensagem: `Seu projeto "${projeto.titulo}" foi rejeitado. Motivo: ${input.motivo}`,
          metadata: JSON.stringify({ projetoId: input.id }),
          lida: false,
        })

        return { success: true }
      } catch (error) {
        console.error("Error rejecting project:", error)
        return {
          success: false,
          error: "Failed to reject project",
        }
      }
    }),

  publishResults: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projeto/{id}/publish-results',
        tags: ['projeto'],
        summary: 'Publish project results',
        description: 'Publish the selection results for a project',
      },
    })
    .input(
      z.object({
        id: z.number(),
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
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
        })

        if (!projeto) {
          return {
            success: false,
            error: "Project not found",
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            resultadosPublicados: true,
            dataPublicacaoResultados: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error("Error publishing results:", error)
        return {
          success: false,
          error: "Failed to publish results",
        }
      }
    }),

  allocateScholarships: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/projeto/{id}/allocate-scholarships',
        tags: ['projeto'],
        summary: 'Allocate scholarships',
        description: 'Allocate available scholarships to projects',
      },
    })
    .input(
      z.object({
        id: z.number(),
        bolsasDisponibilizadas: z.number(),
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
        const projeto = await ctx.db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, input.id),
        })

        if (!projeto) {
          return {
            success: false,
            error: "Project not found",
          }
        }

        await ctx.db
          .update(projetoTable)
          .set({
            bolsasDisponibilizadas: input.bolsasDisponibilizadas,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error("Error allocating scholarships:", error)
        return {
          success: false,
          error: "Failed to allocate scholarships",
        }
      }
    }),
})
