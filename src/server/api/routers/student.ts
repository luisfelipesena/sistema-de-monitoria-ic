import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import {
  alunoTable,
  cursoTable,
  enderecoTable,
  inscricaoTable,
  projetoTable,
  userTable,
  vagaTable,
} from "@/server/db/schema"
import { StatusInscricao, TipoVaga, UserRole } from "@/types/enums"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

export const studentRouter = createTRPCRouter({
  getProfile: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/student/profile',
        tags: ['student'],
        summary: 'Get student profile',
        description: 'Get the profile information for a student',
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
          nomeSocial: z.string().nullable(),
          emailInstitucional: z.string(),
          matricula: z.string(),
          cpf: z.string(),
          cr: z.number(),
          telefone: z.string().nullable(),
          curso: z.object({
            id: z.number(),
            nome: z.string(),
            codigo: z.number(),
          }),
          endereco: z
            .object({
              id: z.number(),
              rua: z.string(),
              numero: z.number().nullable(),
              bairro: z.string(),
              cidade: z.string(),
              estado: z.string(),
              cep: z.string(),
              complemento: z.string().nullable(),
            })
            .nullable(),
          user: z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
          }),
          comprovanteMatriculaFileId: z.string().nullable(),
          comprovanteResidenciaFileId: z.string().nullable(),
          documentoPessoalFileId: z.string().nullable(),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const student = await ctx.db
        .select({
          aluno: alunoTable,
          curso: cursoTable,
          endereco: enderecoTable,
          user: {
            id: userTable.id,
            username: userTable.username,
            email: userTable.email,
          },
        })
        .from(alunoTable)
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(cursoTable, eq(alunoTable.cursoId, cursoTable.id))
        .leftJoin(enderecoTable, eq(alunoTable.enderecoId, enderecoTable.id))
        .where(eq(alunoTable.userId, input.userId))
        .limit(1)

      if (!student[0]) {
        return null
      }

      const { aluno, curso, endereco, user } = student[0]

      return {
        id: aluno.id,
        nomeCompleto: aluno.nomeCompleto,
        nomeSocial: aluno.nomeSocial,
        emailInstitucional: aluno.emailInstitucional,
        matricula: aluno.matricula,
        cpf: aluno.cpf,
        cr: aluno.cr,
        telefone: aluno.telefone,
        curso: {
          id: curso.id,
          nome: curso.nome,
          codigo: curso.codigo,
        },
        endereco: endereco
          ? {
            id: endereco.id,
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep,
            complemento: endereco.complemento,
          }
          : null,
        user: user,
        comprovanteMatriculaFileId: aluno.comprovanteMatriculaFileId,
        comprovanteResidenciaFileId: null,
        documentoPessoalFileId: null,
      }
    }),

  updateProfile: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/student/profile',
        tags: ['student'],
        summary: 'Update student profile',
        description: 'Update student profile information',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        nomeCompleto: z.string().optional(),
        nomeSocial: z.string().optional(),
        emailInstitucional: z.string().email().optional(),
        telefone: z.string().optional(),
        endereco: z
          .object({
            rua: z.string(),
            numero: z.number().optional(),
            bairro: z.string(),
            cidade: z.string(),
            estado: z.string(),
            cep: z.string(),
            complemento: z.string().optional(),
          })
          .optional(),
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
        const aluno = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, input.userId),
        })

        if (!aluno) {
          return {
            success: false,
            error: "Student profile not found",
          }
        }

        return await ctx.db.transaction(async (tx) => {
          const alunoUpdateData: Record<string, unknown> = {}

          if (input.nomeCompleto) alunoUpdateData.nomeCompleto = input.nomeCompleto
          if (input.nomeSocial !== undefined) alunoUpdateData.nomeSocial = input.nomeSocial
          if (input.emailInstitucional) alunoUpdateData.emailInstitucional = input.emailInstitucional
          if (input.telefone !== undefined) alunoUpdateData.telefone = input.telefone

          if (Object.keys(alunoUpdateData).length > 0) {
            await tx
              .update(alunoTable)
              .set({
                ...alunoUpdateData,
                updatedAt: new Date(),
              })
              .where(eq(alunoTable.id, aluno.id))
          }

          if (input.endereco) {
            if (aluno.enderecoId) {
              await tx
                .update(enderecoTable)
                .set({
                  rua: input.endereco.rua,
                  numero: input.endereco.numero || null,
                  bairro: input.endereco.bairro,
                  cidade: input.endereco.cidade,
                  estado: input.endereco.estado,
                  cep: input.endereco.cep,
                  complemento: input.endereco.complemento || null,
                  updatedAt: new Date(),
                })
                .where(eq(enderecoTable.id, aluno.enderecoId))
            } else {
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

              await tx.update(alunoTable).set({ enderecoId: endereco.id }).where(eq(alunoTable.id, aluno.id))
            }
          }

          return { success: true }
        })
      } catch (error) {
        console.error("Error updating student profile:", error)
        return {
          success: false,
          error: "Failed to update profile",
        }
      }
    }),

  getMinhasVagas: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/student/vagas',
        tags: ['student'],
        summary: 'Get student positions',
        description: 'Get all monitoring positions for a student',
      },
    })
    .input(
      z.object({
        alunoId: z.number(),
        ativo: z.boolean().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          tipo: z.nativeEnum(TipoVaga),
          dataInicio: z.date(),
          dataFim: z.date().nullable(),
          ativo: z.boolean(),
          projeto: z.object({
            id: z.number(),
            titulo: z.string(),
            ano: z.number(),
            semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          }),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const vagas = await ctx.db
        .select({
          vaga: vagaTable,
          projeto: {
            id: projetoTable.id,
            titulo: projetoTable.titulo,
            ano: projetoTable.ano,
            semestre: projetoTable.semestre,
          },
        })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(eq(vagaTable.alunoId, input.alunoId))

      return vagas
        .map((item) => ({
          id: item.vaga.id,
          tipo: item.vaga.tipo as TipoVaga,
          dataInicio: item.vaga.dataInicio as Date,
          dataFim: item.vaga.dataFim,
          ativo: !item.vaga.dataFim || item.vaga.dataFim > new Date(),
          projeto: {
            id: item.projeto.id,
            titulo: item.projeto.titulo,
            ano: item.projeto.ano,
            semestre: item.projeto.semestre as "SEMESTRE_1" | "SEMESTRE_2",
          },
        }))
        .filter((vaga) => (input.ativo !== undefined ? vaga.ativo === input.ativo : true))
    }),

  getDashboardInfo: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/student/dashboard',
        tags: ['student'],
        summary: 'Get student dashboard info',
        description: 'Get summary information for student dashboard',
      },
    })
    .input(
      z.object({
        alunoId: z.number(),
      })
    )
    .output(
      z.object({
        totalInscricoes: z.number(),
        inscricoesPendentes: z.number(),
        inscricoesAprovadas: z.number(),
        vagasAtivas: z.number(),
        totalVagas: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [inscricoes, vagas] = await Promise.all([
        ctx.db.select().from(inscricaoTable).where(eq(inscricaoTable.alunoId, input.alunoId)),
        ctx.db.select().from(vagaTable).where(eq(vagaTable.alunoId, input.alunoId)),
      ])

      const inscricoesPendentes = inscricoes.filter((i) => i.status === StatusInscricao.SUBMITTED).length
      const inscricoesAprovadas = inscricoes.filter(
        (i) => i.status === StatusInscricao.ACCEPTED_BOLSISTA || i.status === StatusInscricao.ACCEPTED_VOLUNTARIO
      ).length

      const vagasAtivas = vagas.filter((v) => !v.dataFim || v.dataFim > new Date()).length

      return {
        totalInscricoes: inscricoes.length,
        inscricoesPendentes,
        inscricoesAprovadas,
        vagasAtivas,
        totalVagas: vagas.length,
      }
    }),

  getProjetosDisponiveis: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/student/projetos-disponiveis',
        tags: ['student'],
        summary: 'Get available projects',
        description: 'Get projects available for student applications',
      },
    })
    .input(
      z.object({
        periodoInscricaoId: z.number(),
        alunoId: z.number(),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          titulo: z.string(),
          descricao: z.string(),
          ano: z.number(),
          semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
          bolsasDisponibilizadas: z.number().nullable(),
          voluntariosSolicitados: z.number(),
          jaInscrito: z.boolean(),
          professor: z.object({
            id: z.number(),
            nomeCompleto: z.string(),
          }),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const projetos = await ctx.db
        .select({
          projeto: projetoTable,
          professor: {
            id: userTable.id,
            nomeCompleto: userTable.username,
          },
        })
        .from(projetoTable)
        .innerJoin(userTable, eq(projetoTable.professorResponsavelId, userTable.id))
        .where(eq(projetoTable.status, "APPROVED"))

      const inscricoesExistentes = await ctx.db
        .select({ projetoId: inscricaoTable.projetoId })
        .from(inscricaoTable)
        .where(and(eq(inscricaoTable.alunoId, input.alunoId), eq(inscricaoTable.periodoInscricaoId, input.periodoInscricaoId)))

      const projetosInscritos = new Set(inscricoesExistentes.map((i) => i.projetoId))

      return projetos.map((item) => ({
        id: item.projeto.id,
        titulo: item.projeto.titulo,
        descricao: item.projeto.descricao,
        ano: item.projeto.ano,
        semestre: item.projeto.semestre as "SEMESTRE_1" | "SEMESTRE_2",
        bolsasDisponibilizadas: item.projeto.bolsasDisponibilizadas,
        voluntariosSolicitados: item.projeto.voluntariosSolicitados,
        jaInscrito: projetosInscritos.has(item.projeto.id),
        professor: item.professor,
      }))
    }),

  createStudentProfile: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/student/create-profile',
        tags: ['student'],
        summary: 'Create student profile',
        description: 'Create a new student profile for an existing user',
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
        historicoEscolarFileId: z.string().optional(),
        comprovanteMatriculaFileId: z.string({
          required_error: 'O comprovante de matrícula é obrigatório',
        }),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        alunoId: z.number().optional(),
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
            error: "Student profile already exists for this user",
          }
        }

        const existingMatricula = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.matricula, input.matricula),
        })

        if (existingMatricula) {
          return {
            success: false,
            error: "A student with this registration number already exists",
          }
        }

        if (!input.comprovanteMatriculaFileId) {
          return {
            success: false,
            error: "Comprovante de matrícula é obrigatório",
          }
        }

        const result = await ctx.db.transaction(async (tx) => {
          await tx.update(userTable).set({ role: UserRole.STUDENT }).where(eq(userTable.id, input.userId))

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
              genero: "OUTRO",
              historicoEscolarFileId: input.historicoEscolarFileId,
              comprovanteMatriculaFileId: input.comprovanteMatriculaFileId,
            })
            .returning()

          return aluno
        })

        return {
          success: true,
          alunoId: result.id,
        }
      } catch (error) {
        console.error("Error creating student profile:", error)
        return {
          success: false,
          error: "Failed to create student profile",
        }
      }
    }),

  updateStudentDocuments: publicProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/student/documents',
        tags: ['student'],
        summary: 'Update student documents',
        description: 'Update student file documents',
      },
    })
    .input(
      z.object({
        userId: z.number(),
        historicoEscolarFileId: z.string().optional(),
        comprovanteMatriculaFileId: z.string().optional(),
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
        const aluno = await ctx.db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, input.userId),
        })

        if (!aluno) {
          return {
            success: false,
            error: "Student profile not found",
          }
        }

        const updateData: Record<string, unknown> = {}
        if (input.historicoEscolarFileId !== undefined) {
          updateData.historicoEscolarFileId = input.historicoEscolarFileId
        }
        if (input.comprovanteMatriculaFileId !== undefined) {
          updateData.comprovanteMatriculaFileId = input.comprovanteMatriculaFileId
        }

        if (Object.keys(updateData).length === 0) {
          return {
            success: false,
            error: "No documents to update",
          }
        }

        await ctx.db
          .update(alunoTable)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(alunoTable.id, aluno.id))

        return { success: true }
      } catch (error) {
        console.error("Error updating student documents:", error)
        return {
          success: false,
          error: "Failed to update documents",
        }
      }
    }),
}) 