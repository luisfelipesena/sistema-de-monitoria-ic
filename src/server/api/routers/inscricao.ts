import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import {
  alunoTable,
  inscricaoDocumentoTable,
  inscricaoTable,
  periodoInscricaoTable,
  professorTable,
  projetoTable,
  tipoInscricaoEnum,
  vagaTable,
} from "@/server/db/schema"
import { StatusInscricao, TipoInscricao, TipoVaga } from "@/types/enums"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

export const inscricaoRouter = createTRPCRouter({
  minhasInscricoes: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricao/minhas',
        tags: ['inscricao', 'student'],
        summary: 'Get student applications',
        description: 'Get all applications for the authenticated student',
      },
    })
    .input(
      z.object({
        alunoId: z.number(),
        periodoInscricaoId: z.number().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          status: z.nativeEnum(StatusInscricao),
          tipoVagaPretendida: z.nativeEnum(TipoInscricao).nullable(),
          notaDisciplina: z.string().nullable(),
          notaSelecao: z.string().nullable(),
          notaFinal: z.string().nullable(),
          feedbackProfessor: z.string().nullable(),
          createdAt: z.date(),
          projeto: z.object({
            id: z.number(),
            titulo: z.string(),
            ano: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
            professor: z.object({
              id: z.number(),
              nomeCompleto: z.string(),
            }),
          }),
          periodoInscricao: z.object({
            id: z.number(),
            ano: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          }),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(inscricaoTable.alunoId, input.alunoId)]

      if (input.periodoInscricaoId) {
        conditions.push(eq(inscricaoTable.periodoInscricaoId, input.periodoInscricaoId))
      }

      const inscricoes = await ctx.db
        .select({
          id: inscricaoTable.id,
          status: inscricaoTable.status,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          notaFinal: inscricaoTable.notaFinal,
          feedbackProfessor: inscricaoTable.feedbackProfessor,
          createdAt: inscricaoTable.createdAt,
          projetoId: projetoTable.id,
          projetoTitulo: projetoTable.titulo,
          projetoAno: projetoTable.ano,
          projetoSemestre: projetoTable.semestre,
          professorId: professorTable.id,
          professorNome: professorTable.nomeCompleto,
          periodoId: periodoInscricaoTable.id,
          periodoAno: periodoInscricaoTable.ano,
          periodoSemestre: periodoInscricaoTable.semestre,
        })
        .from(inscricaoTable)
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(periodoInscricaoTable, eq(inscricaoTable.periodoInscricaoId, periodoInscricaoTable.id))
        .where(and(...conditions))

      return inscricoes.map((inscricao) => ({
        id: inscricao.id,
        status: inscricao.status as StatusInscricao,
        tipoVagaPretendida: inscricao.tipoVagaPretendida as TipoInscricao | null,
        notaDisciplina: inscricao.notaDisciplina,
        notaSelecao: inscricao.notaSelecao,
        notaFinal: inscricao.notaFinal,
        feedbackProfessor: inscricao.feedbackProfessor,
        createdAt: inscricao.createdAt,
        projeto: {
          id: inscricao.projetoId,
          titulo: inscricao.projetoTitulo,
          ano: inscricao.projetoAno,
          semestre: inscricao.projetoSemestre as "SEMESTRE_1" | "SEMESTRE_2",
          professor: {
            id: inscricao.professorId,
            nomeCompleto: inscricao.professorNome,
          },
        },
        periodoInscricao: {
          id: inscricao.periodoId,
          ano: inscricao.periodoAno,
          semestre: inscricao.periodoSemestre as "SEMESTRE_1" | "SEMESTRE_2",
        },
      }))
    }),

  candidatosProjeto: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/inscricao/projeto/{projetoId}',
        tags: ['inscricao', 'professor'],
        summary: 'Get project candidates',
        description: 'Get all candidates for a specific project',
      },
    })
    .input(
      z.object({
        projetoId: z.number(),
        professorId: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          status: z.nativeEnum(StatusInscricao),
          tipoVagaPretendida: z.nativeEnum(TipoInscricao).nullable(),
          notaDisciplina: z.string().nullable(),
          notaSelecao: z.string().nullable(),
          coeficienteRendimento: z.string().nullable(),
          notaFinal: z.string().nullable(),
          feedbackProfessor: z.string().nullable(),
          createdAt: z.date(),
          aluno: z.object({
            id: z.number(),
            nomeCompleto: z.string(),
            matricula: z.string(),
            cr: z.number(),
            emailInstitucional: z.string(),
          }),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const projeto = await ctx.db.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, input.projetoId), eq(projetoTable.professorResponsavelId, input.professorId)),
      })

      if (!projeto) {
        throw new Error("Project not found or you do not have access to it")
      }

      const candidatos = await ctx.db
        .select({
          id: inscricaoTable.id,
          status: inscricaoTable.status,
          tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
          notaDisciplina: inscricaoTable.notaDisciplina,
          notaSelecao: inscricaoTable.notaSelecao,
          coeficienteRendimento: inscricaoTable.coeficienteRendimento,
          notaFinal: inscricaoTable.notaFinal,
          feedbackProfessor: inscricaoTable.feedbackProfessor,
          createdAt: inscricaoTable.createdAt,
          alunoId: alunoTable.id,
          alunoNome: alunoTable.nomeCompleto,
          alunoMatricula: alunoTable.matricula,
          alunoCr: alunoTable.cr,
          alunoEmail: alunoTable.emailInstitucional,
        })
        .from(inscricaoTable)
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .where(eq(inscricaoTable.projetoId, input.projetoId))

      return candidatos.map((candidato) => ({
        id: candidato.id,
        status: candidato.status as StatusInscricao,
        tipoVagaPretendida: candidato.tipoVagaPretendida as TipoInscricao | null,
        notaDisciplina: candidato.notaDisciplina,
        notaSelecao: candidato.notaSelecao,
        coeficienteRendimento: candidato.coeficienteRendimento,
        notaFinal: candidato.notaFinal,
        feedbackProfessor: candidato.feedbackProfessor,
        createdAt: candidato.createdAt,
        aluno: {
          id: candidato.alunoId,
          nomeCompleto: candidato.alunoNome,
          matricula: candidato.alunoMatricula,
          cr: candidato.alunoCr,
          emailInstitucional: candidato.alunoEmail,
        },
      }))
    }),

  inscrever: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/inscricao',
        tags: ['inscricao', 'student'],
        summary: 'Submit application',
        description: 'Submit a new application for a monitoring position',
      },
    })
    .input(
      z.object({
        alunoId: z.number(),
        projetoId: z.number(),
        periodoInscricaoId: z.number(),
        tipoVagaPretendida: z.nativeEnum(TipoInscricao),
        documentos: z
          .array(
            z.object({
              fileId: z.string(),
              tipoDocumento: z.string(),
            })
          )
          .optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        inscricaoId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingInscricao = await ctx.db.query.inscricaoTable.findFirst({
          where: and(
            eq(inscricaoTable.alunoId, input.alunoId),
            eq(inscricaoTable.projetoId, input.projetoId),
            eq(inscricaoTable.periodoInscricaoId, input.periodoInscricaoId)
          ),
        })

        if (existingInscricao) {
          return {
            success: false,
            error: "You have already applied for this project in this period",
          }
        }

        const aluno = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.id, input.alunoId),
        })

        if (!aluno) {
          return {
            success: false,
            error: "Student not found",
          }
        }

        const result = await ctx.db.transaction(async (tx) => {
          const [inscricao] = await tx
            .insert(inscricaoTable)
            .values({
              alunoId: input.alunoId,
              projetoId: input.projetoId,
              periodoInscricaoId: input.periodoInscricaoId,
              tipoVagaPretendida: input.tipoVagaPretendida,
              coeficienteRendimento: String(aluno.cr),
              status: StatusInscricao.SUBMITTED,
            })
            .returning()

          if (input.documentos && input.documentos.length > 0) {
            await tx.insert(inscricaoDocumentoTable).values(
              input.documentos.map((doc) => ({
                inscricaoId: inscricao.id,
                fileId: doc.fileId,
                tipoDocumento: doc.tipoDocumento,
              }))
            )
          }

          return inscricao
        })

        return {
          success: true,
          inscricaoId: result.id,
        }
      } catch (error) {
        console.error("Error creating application:", error)
        return {
          success: false,
          error: "Failed to submit application",
        }
      }
    }),

  avaliarCandidato: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/inscricao/{id}/avaliar',
        tags: ['inscricao', 'professor'],
        summary: 'Grade candidate',
        description: 'Set grades for a candidate application',
      },
    })
    .input(
      z.object({
        id: z.number(),
        professorId: z.number(),
        notaDisciplina: z.number().min(0).max(10),
        notaSelecao: z.number().min(0).max(10),
        feedback: z.string().optional(),
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
        const inscricao = await ctx.db
          .select({
            inscricao: inscricaoTable,
            projeto: projetoTable,
            aluno: alunoTable,
          })
          .from(inscricaoTable)
          .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .where(and(eq(inscricaoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
          .limit(1)

        if (!inscricao[0]) {
          return {
            success: false,
            error: "Application not found or you do not have access to it",
          }
        }

        const cr = inscricao[0].aluno.cr
        const notaFinal = (input.notaDisciplina + input.notaSelecao + cr) / 3

        await ctx.db
          .update(inscricaoTable)
          .set({
            notaDisciplina: String(input.notaDisciplina),
            notaSelecao: String(input.notaSelecao),
            notaFinal: String(notaFinal.toFixed(2)),
            feedbackProfessor: input.feedback,
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error("Error grading candidate:", error)
        return {
          success: false,
          error: "Failed to grade candidate",
        }
      }
    }),

  selecionarCandidato: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/inscricao/{id}/selecionar',
        tags: ['inscricao', 'professor'],
        summary: 'Select candidate',
        description: 'Select a candidate for a monitoring position',
      },
    })
    .input(
      z.object({
        id: z.number(),
        professorId: z.number(),
        tipoVaga: z.nativeEnum(TipoVaga),
        feedback: z.string().optional(),
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
        const inscricao = await ctx.db
          .select({
            inscricao: inscricaoTable,
            projeto: projetoTable,
          })
          .from(inscricaoTable)
          .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
          .where(and(eq(inscricaoTable.id, input.id), eq(projetoTable.professorResponsavelId, input.professorId)))
          .limit(1)

        if (!inscricao[0]) {
          return {
            success: false,
            error: "Application not found or you do not have access to it",
          }
        }

        const newStatus =
          input.tipoVaga === TipoVaga.BOLSISTA ? StatusInscricao.SELECTED_BOLSISTA : StatusInscricao.SELECTED_VOLUNTARIO

        await ctx.db
          .update(inscricaoTable)
          .set({
            status: newStatus,
            feedbackProfessor: input.feedback,
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error("Error selecting candidate:", error)
        return {
          success: false,
          error: "Failed to select candidate",
        }
      }
    }),

  aceitarVaga: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/inscricao/{id}/aceitar',
        tags: ['inscricao', 'student'],
        summary: 'Accept position',
        description: 'Accept a monitoring position offer',
      },
    })
    .input(
      z.object({
        id: z.number(),
        alunoId: z.number(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        vagaId: z.number().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const inscricao = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.id, input.id), eq(inscricaoTable.alunoId, input.alunoId)),
        })

        if (!inscricao) {
          return {
            success: false,
            error: "Application not found",
          }
        }

        if (
          inscricao.status !== StatusInscricao.SELECTED_BOLSISTA &&
          inscricao.status !== StatusInscricao.SELECTED_VOLUNTARIO
        ) {
          return {
            success: false,
            error: "Application is not in a state that can be accepted",
          }
        }

        const tipoVaga = inscricao.status === StatusInscricao.SELECTED_BOLSISTA ? TipoVaga.BOLSISTA : TipoVaga.VOLUNTARIO
        const newStatus =
          inscricao.status === StatusInscricao.SELECTED_BOLSISTA
            ? StatusInscricao.ACCEPTED_BOLSISTA
            : StatusInscricao.ACCEPTED_VOLUNTARIO

        const result = await ctx.db.transaction(async (tx) => {
          await tx
            .update(inscricaoTable)
            .set({
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(inscricaoTable.id, input.id))

          const [vaga] = await tx
            .insert(vagaTable)
            .values({
              alunoId: input.alunoId,
              projetoId: inscricao.projetoId,
              inscricaoId: inscricao.id,
              tipo: tipoVaga,
              dataInicio: new Date(),
            })
            .returning()

          return vaga
        })

        return {
          success: true,
          vagaId: result.id,
        }
      } catch (error) {
        console.error("Error accepting position:", error)
        return {
          success: false,
          error: "Failed to accept position",
        }
      }
    }),

  recusarVaga: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/inscricao/{id}/recusar',
        tags: ['inscricao', 'student'],
        summary: 'Reject position',
        description: 'Reject a monitoring position offer',
      },
    })
    .input(
      z.object({
        id: z.number(),
        alunoId: z.number(),
        motivoRecusa: z.string().optional(),
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
        const inscricao = await ctx.db.query.inscricaoTable.findFirst({
          where: and(eq(inscricaoTable.id, input.id), eq(inscricaoTable.alunoId, input.alunoId)),
        })

        if (!inscricao) {
          return {
            success: false,
            error: "Application not found",
          }
        }

        if (
          inscricao.status !== StatusInscricao.SELECTED_BOLSISTA &&
          inscricao.status !== StatusInscricao.SELECTED_VOLUNTARIO
        ) {
          return {
            success: false,
            error: "Application is not in a state that can be rejected",
          }
        }

        await ctx.db
          .update(inscricaoTable)
          .set({
            status: StatusInscricao.REJECTED_BY_STUDENT,
            feedbackProfessor: input.motivoRecusa || "Student declined the position",
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, input.id))

        return { success: true }
      } catch (error) {
        console.error("Error rejecting position:", error)
        return {
          success: false,
          error: "Failed to reject position",
        }
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        projetoId: z.number(),
        tipoVagaPretendida: z.enum(tipoInscricaoEnum.enumValues),
      })
    )
    .mutation(async ({ input }) => {
      const studentId = 1
      const periodoInscricaoId = 1

      console.log("Creating inscription:", {
        alunoId: studentId,
        projetoId: input.projetoId,
        periodoInscricaoId: periodoInscricaoId,
        tipoVagaPretendida: input.tipoVagaPretendida,
      })

      return { success: true }
    }),
}) 