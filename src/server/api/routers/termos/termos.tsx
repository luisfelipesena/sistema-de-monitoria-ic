import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import {
  alunoTable,
  assinaturaDocumentoTable,
  projetoDocumentoTable,
  projetoTable,
  vagaTable,
} from "@/server/db/schema"
import { emailService } from "@/server/lib/email-service"
import minioClient from "@/server/lib/minio"
import { TermoCompromissoTemplate, type TermoCompromissoProps } from "@/server/lib/pdfTemplates/termo"
import { renderToBuffer } from "@react-pdf/renderer"
import { TRPCError } from "@trpc/server"
import { and, eq, sql } from "drizzle-orm"
import { PDFDocument } from "pdf-lib"
import { z } from "zod"

export const termosRouter = createTRPCRouter({
  // Gerar termo de compromisso
  generateTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar vaga com dados relacionados
      const vagaData = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: { user: true },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
        },
      })

      if (!vagaData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vaga não encontrada",
        })
      }

      // Verificar permissões (professor do projeto ou admin)
      if (user.role !== "admin" && (user.role !== "professor" || vagaData.projeto.professorResponsavelId !== user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para gerar este termo",
        })
      }

      const disciplinaPrincipal = vagaData.projeto.disciplinas[0]?.disciplina ?? { nome: "N/A", codigo: "N/A" }

      // Preparar dados para o PDF
      const termoData: TermoCompromissoProps = {
        vaga: {
          id: vagaData.id.toString(),
          tipoBolsa: vagaData.tipo.toLowerCase() as "bolsista" | "voluntario",
          dataInicio: vagaData.dataInicio || new Date(),
          aluno: {
            user: {
              name: vagaData.aluno.user.username,
              email: vagaData.aluno.user.email,
            },
            matricula: vagaData.aluno.matricula ?? undefined,
            rg: vagaData.aluno.rg ?? undefined,
            cpf: vagaData.aluno.cpf ?? undefined,
          },
          projeto: {
            disciplina: {
              nome: disciplinaPrincipal.nome,
              codigo: disciplinaPrincipal.codigo,
              departamento: {
                nome: vagaData.projeto.departamento.nome,
                sigla: vagaData.projeto.departamento.sigla || "IC",
              },
            },
            professor: {
              user: {
                name: vagaData.projeto.professorResponsavel.nomeCompleto,
                email: vagaData.projeto.professorResponsavel.user.email,
              },
              siape: vagaData.projeto.professorResponsavel.matriculaSiape ?? undefined,
            },
          },
          semestre: {
            ano: vagaData.projeto.ano,
            numero: vagaData.projeto.semestre === "SEMESTRE_1" ? 1 : 2,
          },
        },
        dataGeracao: new Date(),
      }

      try {
        // Gerar PDF
        const pdfBuffer = await renderToBuffer(<TermoCompromissoTemplate {...termoData} />)

        // Upload para MinIO
        const fileName = `termos/TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}-${
          vagaData.id
        }.pdf`
        await minioClient.putObject("documents", fileName, pdfBuffer, pdfBuffer.length, {
          "Content-Type": "application/pdf",
        })

        // Salvar no banco (documento do projeto)
        await ctx.db.insert(projetoDocumentoTable).values({
          projetoId: vagaData.projetoId,
          fileId: fileName,
          tipoDocumento: "ATA_SELECAO",
          observacoes: `Termo de compromisso gerado para vaga ${input.vagaId}`,
        })

        return {
          success: true,
          termoNumero: `TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}-${
            vagaData.id
          }`,
          fileName,
          message: "Termo de compromisso gerado com sucesso",
        }
      } catch (error) {
        console.error("Erro ao gerar termo:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar termo de compromisso",
        })
      }
    }),

  // Download do termo de compromisso
  downloadTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      // Buscar vaga
      const vagaData = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
        },
      })

      if (!vagaData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vaga não encontrada",
        })
      }

      // Verificar permissões (aluno da vaga, professor do projeto ou admin)
      const isAluno = user.role === "student" && vagaData.aluno.userId === user.id
      const isProfessor = user.role === "professor" && vagaData.projeto.professorResponsavelId === user.id
      const isAdmin = user.role === "admin"

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para baixar este termo",
        })
      }

      // Buscar documento do termo
      const termoNumero = `TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}-${
        vagaData.id
      }`
      const fileName = `termos/${termoNumero}.pdf`

      try {
        // Verificar se arquivo existe no MinIO
        const stat = await minioClient.statObject("documents", fileName)

        // Gerar URL pré-assinada para download
        const downloadUrl = await minioClient.presignedGetObject("documents", fileName, 24 * 60 * 60) // 24 horas

        return {
          downloadUrl,
          fileName: `${termoNumero}.pdf`,
          fileSize: stat.size,
        }
      } catch (error) {
        console.error("Erro ao gerar download:", error)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Termo não encontrado. Gere o termo primeiro.",
        })
      }
    }),

  // Assinar termo digitalmente
  signTermo: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
        assinaturaData: z.string(), // Base64 da assinatura
        tipoAssinatura: z.enum(["TERMO_COMPROMISSO_ALUNO", "ATA_SELECAO_PROFESSOR"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx
      const vagaId = parseInt(input.vagaId)

      const vagaData = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, vagaId),
        with: {
          aluno: true,
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
        },
      })

      if (!vagaData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vaga não encontrada" })
      }

      if (input.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO" && vagaData.aluno.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o aluno pode assinar como aluno." })
      }
      if (input.tipoAssinatura === "ATA_SELECAO_PROFESSOR" && vagaData.projeto.professorResponsavelId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o professor responsável pode assinar.",
        })
      }

      const assinaturaExistente = await ctx.db.query.assinaturaDocumentoTable.findFirst({
        where: and(
          eq(assinaturaDocumentoTable.vagaId, vagaId),
          eq(assinaturaDocumentoTable.tipoAssinatura, input.tipoAssinatura)
        ),
      })

      if (assinaturaExistente) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este documento já foi assinado por você." })
      }

      const fileName = `termos/TC-${vagaData.projeto.ano}-${vagaData.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}-${
        vagaData.id
      }.pdf`

      try {
        await ctx.db.transaction(async (tx) => {
          await tx.insert(assinaturaDocumentoTable).values({
            assinaturaData: input.assinaturaData,
            tipoAssinatura: input.tipoAssinatura,
            userId: user.id,
            vagaId,
          })

          const allSignatures = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, vagaId),
          })

          const pdfStream = await minioClient.getObject("documents", fileName)
          const chunks = []
          for await (const chunk of pdfStream) {
            chunks.push(chunk)
          }
          const pdfBuffer = Buffer.concat(chunks)
          const pdfDoc = await PDFDocument.load(pdfBuffer)
          const page = pdfDoc.getPages()[0]

          for (const signature of allSignatures) {
            const signatureBuffer = Buffer.from(signature.assinaturaData.split(",")[1], "base64")
            const signatureImage = await pdfDoc.embedPng(signatureBuffer)
            const signatureDims = signatureImage.scale(0.25)

            let coords = { x: 0, y: 0 }
            if (signature.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO") {
              coords = { x: 90, y: 155 }
            } else if (signature.tipoAssinatura === "ATA_SELECAO_PROFESSOR") {
              coords = { x: 330, y: 155 }
            }

            page.drawImage(signatureImage, { ...coords, width: signatureDims.width, height: signatureDims.height })
          }

          const modifiedPdfBytes = await pdfDoc.save()
          await minioClient.putObject("documents", fileName, Buffer.from(modifiedPdfBytes), modifiedPdfBytes.length, {
            "Content-Type": "application/pdf",
          })
        })
      } catch (error) {
        console.error("Erro ao assinar termo:", error)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao assinar o termo digitalmente." })
      }

      return { success: true, message: "Termo assinado com sucesso" }
    }),

  // Buscar status dos termos de um projeto
  getTermosStatus: protectedProcedure
    .input(
      z.object({
        projetoId: z.string().optional(),
        vagaId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      if (!input.projetoId && !input.vagaId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Forneça projetoId ou vagaId",
        })
      }

      let vagas: any[] = []

      if (input.projetoId) {
        // Buscar todas as vagas do projeto
        vagas = await ctx.db.query.vagaTable.findMany({
          where: eq(vagaTable.projetoId, parseInt(input.projetoId)),
          with: {
            aluno: {
              with: { user: true },
            },
            projeto: {
              with: {
                professorResponsavel: true,
              },
            },
          },
        })

        // Verificar permissões do projeto
        if (vagas.length > 0) {
          const projeto = vagas[0].projeto
          if (user.role === "professor" && projeto.professorResponsavelId !== user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Você só pode ver termos de seus próprios projetos",
            })
          }
        }
      } else {
        // Buscar vaga específica
        const vaga = await ctx.db.query.vagaTable.findFirst({
          where: eq(vagaTable.id, parseInt(input.vagaId!)),
          with: {
            aluno: {
              with: { user: true },
            },
            projeto: {
              with: {
                professorResponsavel: true,
              },
            },
          },
        })

        if (!vaga) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vaga não encontrada",
          })
        }

        vagas = [vaga]

        // Verificar permissões da vaga
        const isAluno = user.role === "student" && vaga.aluno.userId === user.id
        const isProfessor = user.role === "professor" && vaga.projeto.professorResponsavelId === user.id
        const isAdmin = user.role === "admin"

        if (!isAluno && !isProfessor && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para ver este termo",
          })
        }
      }

      // Para cada vaga, buscar status das assinaturas
      const termosStatus = await Promise.all(
        vagas.map(async (vagaItem) => {
          const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
            with: {
              user: true,
            },
          })

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO")
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === "ATA_SELECAO_PROFESSOR")

          let statusTermo = "pendente_assinatura"
          if (assinaturaAluno && assinaturaProfessor) {
            statusTermo = "assinado_completo"
          } else if (assinaturaAluno || assinaturaProfessor) {
            statusTermo = "parcialmente_assinado"
          }

          return {
            vagaId: vagaItem.id,
            alunoNome: vagaItem.aluno.user.username,
            tipoVaga: vagaItem.tipo,
            statusTermo,
            assinaturaAluno: !!assinaturaAluno,
            assinaturaProfessor: !!assinaturaProfessor,
            dataAssinaturaAluno: assinaturaAluno?.createdAt,
            dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
            termoNumero: `TC-${vagaItem.projeto.ano}-${vagaItem.projeto.semestre === "SEMESTRE_1" ? "1" : "2"}-${
              vagaItem.id
            }`,
            observacoes: null, // Pode ser implementado se necessário
          }
        })
      )

      return termosStatus
    }),

  // Buscar termos pendentes (para dashboard)
  getTermosPendentes: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx

    if (user.role === "student") {
      // Aluno: termos pendentes de sua assinatura
      const vagasAluno = await ctx.db.query.vagaTable.findMany({
        where: sql`${vagaTable.alunoId} IN (
            SELECT id FROM ${alunoTable} WHERE ${alunoTable.userId} = ${user.id}
          )`,
        with: {
          projeto: {
            columns: {
              titulo: true,
            },
            with: {
              professorResponsavel: true,
            },
          },
          aluno: true,
        },
      })

      const termosPendentes = await Promise.all(
        vagasAluno.map(async (vagaItem) => {
          const assinaturaAluno = await ctx.db.query.assinaturaDocumentoTable.findFirst({
            where: and(
              eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
              eq(assinaturaDocumentoTable.tipoAssinatura, "TERMO_COMPROMISSO_ALUNO")
            ),
          })

          if (!assinaturaAluno) {
            return {
              vagaId: vagaItem.id,
              projeto: vagaItem.projeto.titulo,
              tipo: vagaItem.tipo,
              professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
              pendenteDe: "aluno",
            }
          }
          return null
        })
      )

      return termosPendentes.filter(Boolean)
    } else if (user.role === "professor") {
      // Professor: termos pendentes de sua assinatura
      const vagasProfessor = await ctx.db.query.vagaTable.findMany({
        where: sql`${vagaTable.projetoId} IN (
            SELECT id FROM ${projetoTable} WHERE ${projetoTable.professorResponsavelId} = ${user.id}
          )`,
        with: {
          projeto: true,
          aluno: {
            with: { user: true },
          },
        },
      })

      const termosPendentes = await Promise.all(
        vagasProfessor.map(async (vagaItem) => {
          const assinaturaProfessor = await ctx.db.query.assinaturaDocumentoTable.findFirst({
            where: and(
              eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
              eq(assinaturaDocumentoTable.tipoAssinatura, "ATA_SELECAO_PROFESSOR")
            ),
          })

          if (!assinaturaProfessor) {
            return {
              vagaId: vagaItem.id,
              projeto: vagaItem.projeto.titulo,
              tipo: vagaItem.tipo,
              aluno: vagaItem.aluno.user.username,
              pendenteDe: "professor",
            }
          }
          return null
        })
      )

      return termosPendentes.filter(Boolean)
    } else {
      // Admin: todos os termos pendentes
      const todasVagas = await ctx.db.query.vagaTable.findMany({
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
          aluno: {
            with: { user: true },
          },
        },
      })

      const termosPendentes = await Promise.all(
        todasVagas.map(async (vagaItem) => {
          const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
            where: eq(assinaturaDocumentoTable.vagaId, vagaItem.id),
          })

          const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO")
          const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === "ATA_SELECAO_PROFESSOR")

          if (!assinaturaAluno || !assinaturaProfessor) {
            return {
              vagaId: vagaItem.id,
              projeto: vagaItem.projeto.titulo,
              tipo: vagaItem.tipo,
              aluno: vagaItem.aluno.user.username,
              professor: vagaItem.projeto.professorResponsavel.nomeCompleto,
              pendenteDe: !assinaturaAluno ? "aluno" : "professor",
              statusCompleto: !!(assinaturaAluno && assinaturaProfessor),
            }
          }
          return null
        })
      )

      return termosPendentes.filter(Boolean)
    }
  }),

  // Notificar sobre pendências de assinatura
  notificarPendencias: protectedProcedure
    .input(
      z.object({
        vagaId: z.string().optional(),
        projetoId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx

      if (user.role !== "admin" && user.role !== "professor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas admins e professores podem notificar pendências",
        })
      }

      let vagas: any[] = []

      if (input.vagaId) {
        const vaga = await ctx.db.query.vagaTable.findFirst({
          where: eq(vagaTable.id, parseInt(input.vagaId)),
          with: {
            aluno: { with: { user: true } },
            projeto: { with: { professorResponsavel: { with: { user: true } } } },
          },
        })
        if (vaga) vagas = [vaga]
      } else if (input.projetoId) {
        vagas = await ctx.db.query.vagaTable.findMany({
          where: eq(vagaTable.projetoId, parseInt(input.projetoId)),
          with: {
            aluno: { with: { user: true } },
            projeto: { with: { professorResponsavel: { with: { user: true } } } },
          },
        })
      }

      let notificacoesEnviadas = 0

      for (const vaga of vagas) {
        // Verificar assinaturas pendentes
        const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
          where: eq(assinaturaDocumentoTable.vagaId, vaga.id),
        })

        const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO")
        const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === "ATA_SELECAO_PROFESSOR")

        // Notificar aluno se necessário
        if (!assinaturaAluno) {
          try {
            await emailService.sendGenericEmail({
              to: vaga.aluno.user.email,
              subject: "Lembrete: Assinatura de Termo de Compromisso Pendente",
              html: `
Olá ${vaga.aluno.user.username},<br><br>

Você tem um termo de compromisso pendente de assinatura para a monitoria do projeto ${vaga.projeto.titulo}.<br><br>

Acesse o sistema para assinar digitalmente: <a href="/student/termos-compromisso">Assinar Termo</a><br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
              `,
              tipoNotificacao: "TERMO_PENDENTE",
              remetenteUserId: user.id,
              projetoId: vaga.projetoId,
              alunoId: vaga.alunoId,
            })
            notificacoesEnviadas++
          } catch (error) {
            console.error("Erro ao notificar aluno:", error)
          }
        }

        // Notificar professor se necessário
        if (!assinaturaProfessor) {
          try {
            await emailService.sendGenericEmail({
              to: vaga.projeto.professorResponsavel.user.email,
              subject: "Lembrete: Assinatura de Termo de Compromisso Pendente",
              html: `
Olá ${vaga.projeto.professorResponsavel.nomeCompleto},<br><br>

Você tem um termo de compromisso pendente de assinatura para o aluno ${vaga.aluno.user.username} do projeto ${vaga.projeto.titulo}.<br><br>

Acesse o sistema para assinar digitalmente: <a href="/professor/termos-compromisso">Assinar Termo</a><br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
              `,
              tipoNotificacao: "TERMO_PENDENTE",
              remetenteUserId: user.id,
              projetoId: vaga.projetoId,
              // professorId: vaga.projeto.professorResponsavelId,
            })
            notificacoesEnviadas++
          } catch (error) {
            console.error("Erro ao notificar professor:", error)
          }
        }
      }

      return {
        success: true,
        notificacoesEnviadas,
        message: `${notificacoesEnviadas} notificações enviadas com sucesso`,
      }
    }),

  // Validar se termo está pronto para finalização
  validateTermoReady: protectedProcedure
    .input(
      z.object({
        vagaId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { user } = ctx

      const vagaData = await ctx.db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, parseInt(input.vagaId)),
        with: {
          aluno: { with: { user: true } },
          projeto: { with: { professorResponsavel: { with: { user: true } } } },
        },
      })

      if (!vagaData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vaga não encontrada",
        })
      }

      // Verificar permissões
      const isAluno = user.role === "student" && vagaData.aluno.userId === user.id
      const isProfessor = user.role === "professor" && vagaData.projeto.professorResponsavelId === user.id
      const isAdmin = user.role === "admin"

      if (!isAluno && !isProfessor && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para validar este termo",
        })
      }

      // Verificar assinaturas
      const assinaturas = await ctx.db.query.assinaturaDocumentoTable.findMany({
        where: eq(assinaturaDocumentoTable.vagaId, parseInt(input.vagaId)),
      })

      const assinaturaAluno = assinaturas.find((a) => a.tipoAssinatura === "TERMO_COMPROMISSO_ALUNO")
      const assinaturaProfessor = assinaturas.find((a) => a.tipoAssinatura === "ATA_SELECAO_PROFESSOR")

      const pendencias: string[] = []
      if (!assinaturaAluno) pendencias.push("Assinatura do aluno")
      if (!assinaturaProfessor) pendencias.push("Assinatura do professor responsável")

      return {
        termoCompleto: pendencias.length === 0,
        pendencias,
        statusDetalhado: {
          assinaturaAluno: !!assinaturaAluno,
          assinaturaProfessor: !!assinaturaProfessor,
          dataAssinaturaAluno: assinaturaAluno?.createdAt,
          dataAssinaturaProfessor: assinaturaProfessor?.createdAt,
        },
        proximosPassos:
          pendencias.length === 0
            ? ["Termo pronto para ativação da monitoria"]
            : pendencias.map((p) => `Aguardando: ${p}`),
      }
    }),
})
