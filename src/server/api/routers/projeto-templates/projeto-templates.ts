import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import { projetoTemplateTable } from '@/server/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

export const projetoTemplatesRouter = createTRPCRouter({
  getTemplates: adminProtectedProcedure.query(async ({ ctx }) => {
    const templates = await ctx.db.query.projetoTemplateTable.findMany({
      orderBy: [desc(projetoTemplateTable.updatedAt)],
      with: {
        disciplina: {
          with: {
            departamento: {
              columns: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
        criadoPor: {
          columns: {
            id: true,
            username: true,
            email: true,
          },
        },
        ultimaAtualizacaoPor: {
          columns: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return templates.map((template) => ({
      id: template.id,
      disciplinaId: template.disciplinaId,
      tituloDefault: template.tituloDefault,
      descricaoDefault: template.descricaoDefault,
      cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault,
      numeroSemanasDefault: template.numeroSemanasDefault,
      publicoAlvoDefault: template.publicoAlvoDefault,
      atividadesDefault: template.atividadesDefault ? (JSON.parse(template.atividadesDefault) as string[]) : [],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      disciplina: {
        id: template.disciplina.id,
        nome: template.disciplina.nome,
        codigo: template.disciplina.codigo,
        departamento: template.disciplina.departamento,
      },
      criadoPor: template.criadoPor,
      ultimaAtualizacaoPor: template.ultimaAtualizacaoPor,
    }))
  }),

  getTemplate: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const template = await ctx.db.query.projetoTemplateTable.findFirst({
      where: eq(projetoTemplateTable.id, input.id),
      with: {
        disciplina: {
          with: {
            departamento: true,
          },
        },
        criadoPor: true,
        ultimaAtualizacaoPor: true,
      },
    })

    if (!template) {
      throw new Error('Template não encontrado')
    }

    return {
      ...template,
      atividadesDefault: template.atividadesDefault ? (JSON.parse(template.atividadesDefault) as string[]) : [],
    }
  }),

  createTemplate: adminProtectedProcedure
    .input(
      z.object({
        disciplinaId: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().int().positive().optional(),
        numeroSemanasDefault: z.number().int().positive().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if template already exists for this discipline
      const existingTemplate = await ctx.db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.disciplinaId, input.disciplinaId),
      })

      if (existingTemplate) {
        throw new Error('Já existe um template para esta disciplina')
      }

      const { atividadesDefault, ...templateData } = input

      const [template] = await ctx.db
        .insert(projetoTemplateTable)
        .values({
          ...templateData,
          atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
          criadoPorUserId: ctx.user.id,
        })
        .returning()

      return template
    }),

  updateTemplate: adminProtectedProcedure
    .input(
      z.object({
        id: z.number(),
        tituloDefault: z.string().optional(),
        descricaoDefault: z.string().optional(),
        cargaHorariaSemanaDefault: z.number().int().positive().optional(),
        numeroSemanasDefault: z.number().int().positive().optional(),
        publicoAlvoDefault: z.string().optional(),
        atividadesDefault: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, atividadesDefault, ...updateData } = input

      const template = await ctx.db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.id, id),
      })

      if (!template) {
        throw new Error('Template não encontrado')
      }

      const [updated] = await ctx.db
        .update(projetoTemplateTable)
        .set({
          ...updateData,
          atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
          ultimaAtualizacaoUserId: ctx.user.id,
        })
        .where(eq(projetoTemplateTable.id, id))
        .returning()

      return updated
    }),

  deleteTemplate: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const template = await ctx.db.query.projetoTemplateTable.findFirst({
      where: eq(projetoTemplateTable.id, input.id),
    })

    if (!template) {
      throw new Error('Template não encontrado')
    }

    await ctx.db.delete(projetoTemplateTable).where(eq(projetoTemplateTable.id, input.id))

    return { success: true }
  }),

  getDisciplinasDisponiveis: adminProtectedProcedure.query(async ({ ctx }) => {
    // Get disciplines that don't have templates yet
    const allDisciplinas = await ctx.db.query.disciplinaTable.findMany({
      with: {
        departamento: {
          columns: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    })

    const templatesExistentes = await ctx.db.query.projetoTemplateTable.findMany({
      columns: {
        disciplinaId: true,
      },
    })

    const disciplinasComTemplate = new Set(templatesExistentes.map((t) => t.disciplinaId))

    return allDisciplinas.filter((d) => !disciplinasComTemplate.has(d.id))
  }),

  getTemplateByDisciplina: adminProtectedProcedure
    .input(z.object({ disciplinaId: z.number() }))
    .query(async ({ input, ctx }) => {
      const template = await ctx.db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.disciplinaId, input.disciplinaId),
        with: {
          disciplina: {
            with: {
              departamento: true,
            },
          },
        },
      })

      if (!template) {
        return null
      }

      return {
        ...template,
        atividadesDefault: template.atividadesDefault ? (JSON.parse(template.atividadesDefault) as string[]) : [],
      }
    }),

  duplicateTemplate: adminProtectedProcedure
    .input(
      z.object({
        sourceId: z.number(),
        targetDisciplinaId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sourceTemplate = await ctx.db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.id, input.sourceId),
      })

      if (!sourceTemplate) {
        throw new Error('Template fonte não encontrado')
      }

      // Check if target discipline already has a template
      const existingTemplate = await ctx.db.query.projetoTemplateTable.findFirst({
        where: eq(projetoTemplateTable.disciplinaId, input.targetDisciplinaId),
      })

      if (existingTemplate) {
        throw new Error('A disciplina de destino já possui um template')
      }

      const [newTemplate] = await ctx.db
        .insert(projetoTemplateTable)
        .values({
          disciplinaId: input.targetDisciplinaId,
          tituloDefault: sourceTemplate.tituloDefault,
          descricaoDefault: sourceTemplate.descricaoDefault,
          cargaHorariaSemanaDefault: sourceTemplate.cargaHorariaSemanaDefault,
          numeroSemanasDefault: sourceTemplate.numeroSemanasDefault,
          publicoAlvoDefault: sourceTemplate.publicoAlvoDefault,
          atividadesDefault: sourceTemplate.atividadesDefault,
          criadoPorUserId: ctx.user.id,
        })
        .returning()

      return newTemplate
    }),

  getTemplateStats: adminProtectedProcedure.query(async ({ ctx }) => {
    const totalTemplates = await ctx.db.query.projetoTemplateTable.findMany()
    const totalDisciplinas = await ctx.db.query.disciplinaTable.findMany()

    return {
      totalTemplates: totalTemplates.length,
      totalDisciplinas: totalDisciplinas.length,
      cobertura: totalDisciplinas.length > 0
        ? Math.round((totalTemplates.length / totalDisciplinas.length) * 100)
        : 0, 
      disciplinasSemTemplate: totalDisciplinas.length - totalTemplates.length,
    }
  }),
})
