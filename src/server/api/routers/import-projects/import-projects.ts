import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { createTRPCRouter, adminProtectedProcedure } from '@/server/api/trpc'
import {
  importacaoPlanejamentoTable,
  projetoTable,
  professorTable,
  disciplinaTable,
  atividadeProjetoTable,
  projetoDisciplinaTable,
  type NewProjeto,
} from '@/server/db/schema'

export const importProjectsRouter = createTRPCRouter({
  uploadFile: adminProtectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        fileName: z.string(),
        ano: z.number().int().min(2000).max(2100),
        semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const importacao = await ctx.db
        .insert(importacaoPlanejamentoTable)
        .values({
          fileId: input.fileId,
          nomeArquivo: input.fileName,
          ano: input.ano,
          semestre: input.semestre,
          status: 'PROCESSANDO',
          importadoPorUserId: ctx.user.id,
        })
        .returning()

      return importacao[0]
    }),

  processImportedFile: adminProtectedProcedure
    .input(
      z.object({
        importacaoId: z.number(),
        projetos: z.array(
          z.object({
            titulo: z.string(),
            descricao: z.string(),
            professorSiape: z.string(),
            disciplinaCodigo: z.string(),
            cargaHorariaSemana: z.number(),
            numeroSemanas: z.number(),
            publicoAlvo: z.string(),
            bolsasSolicitadas: z.number().default(0),
            voluntariosSolicitados: z.number().default(0),
            atividades: z.array(z.string()).optional(),
            tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA']).default('INDIVIDUAL'),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now()
      const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes timeout

      let projetosCriados = 0
      let projetosComErro = 0
      const erros: string[] = []

      // Validar tamanho da importação
      if (input.projetos.length > 100) {
        throw new Error('Importação muito grande. Máximo de 100 projetos por vez.')
      }

      // Primeiro, validar se a importação existe e está no status correto
      const importacao = await ctx.db.query.importacaoPlanejamentoTable.findFirst({
        where: eq(importacaoPlanejamentoTable.id, input.importacaoId),
      })

      if (!importacao) {
        throw new Error('Importação não encontrada')
      }

      if (importacao.status !== 'PROCESSANDO') {
        throw new Error('Importação não está em processamento')
      }

      for (const projetoData of input.projetos) {
        // Verificar timeout
        if (Date.now() - startTime > TIMEOUT_MS) {
          erros.push('Timeout: Importação cancelada devido ao tempo limite excedido')
          break
        }

        try {
          const professor = await ctx.db.query.professorTable.findFirst({
            where: eq(professorTable.matriculaSiape, projetoData.professorSiape),
            with: { departamento: true },
          })

          if (!professor) {
            erros.push(`Professor com SIAPE ${projetoData.professorSiape} não encontrado`)
            projetosComErro++
            continue
          }

          const disciplina = await ctx.db.query.disciplinaTable.findFirst({
            where: eq(disciplinaTable.codigo, projetoData.disciplinaCodigo),
          })

          if (!disciplina) {
            erros.push(`Disciplina ${projetoData.disciplinaCodigo} não encontrada`)
            projetosComErro++
            continue
          }

          const novoProjeto: NewProjeto = {
            titulo: projetoData.titulo,
            descricao: projetoData.descricao,
            professorResponsavelId: professor.id,
            departamentoId: professor.departamentoId,
            ano: importacao.ano,
            semestre: importacao.semestre,
            cargaHorariaSemana: projetoData.cargaHorariaSemana,
            numeroSemanas: projetoData.numeroSemanas,
            publicoAlvo: projetoData.publicoAlvo,
            bolsasSolicitadas: projetoData.bolsasSolicitadas,
            voluntariosSolicitados: projetoData.voluntariosSolicitados,
            tipoProposicao: projetoData.tipoProposicao,
            status: 'PENDING_PROFESSOR_SIGNATURE',
          }

          const [projeto] = await ctx.db.insert(projetoTable).values(novoProjeto).returning()

          await ctx.db.insert(projetoDisciplinaTable).values({
            projetoId: projeto.id,
            disciplinaId: disciplina.id,
          })

          if (projetoData.atividades && projetoData.atividades.length > 0) {
            const atividades = projetoData.atividades.map((descricao) => ({
              projetoId: projeto.id,
              descricao,
            }))
            await ctx.db.insert(atividadeProjetoTable).values(atividades)
          }

          projetosCriados++
        } catch (error) {
          erros.push(
            `Erro ao criar projeto "${projetoData.titulo}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          )
          projetosComErro++
        }
      }

      // Determinar status final
      let finalStatus = 'CONCLUIDO'
      if (erros.some((erro) => erro.includes('Timeout'))) {
        finalStatus = 'ERRO'
      } else if (projetosComErro > 0) {
        finalStatus = 'CONCLUIDO_COM_ERROS'
      }

      await ctx.db
        .update(importacaoPlanejamentoTable)
        .set({
          totalProjetos: input.projetos.length,
          projetosCriados,
          projetosComErro,
          status: finalStatus,
          erros: erros.length > 0 ? JSON.stringify(erros) : null,
        })
        .where(eq(importacaoPlanejamentoTable.id, input.importacaoId))

      return {
        projetosCriados,
        projetosComErro,
        erros,
      }
    }),

  getImportHistory: adminProtectedProcedure.query(async ({ ctx }) => {
    const imports = await ctx.db.query.importacaoPlanejamentoTable.findMany({
      orderBy: [desc(importacaoPlanejamentoTable.createdAt)],
      with: {
        importadoPor: {
          columns: {
            username: true,
            email: true,
          },
        },
      },
    })

    return imports.map((imp) => ({
      id: imp.id,
      nomeArquivo: imp.nomeArquivo,
      ano: imp.ano,
      semestre: imp.semestre,
      totalProjetos: imp.totalProjetos,
      projetosCriados: imp.projetosCriados,
      projetosComErro: imp.projetosComErro,
      status: imp.status,
      erros: imp.erros ? JSON.parse(imp.erros) : [],
      importadoPor: imp.importadoPor,
      createdAt: imp.createdAt,
    }))
  }),

  getImportDetails: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const importacao = await ctx.db.query.importacaoPlanejamentoTable.findFirst({
      where: eq(importacaoPlanejamentoTable.id, input.id),
      with: {
        importadoPor: true,
      },
    })

    if (!importacao) {
      throw new Error('Importação não encontrada')
    }

    return {
      ...importacao,
      erros: importacao.erros ? JSON.parse(importacao.erros) : [],
    }
  }),

  deleteImport: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(importacaoPlanejamentoTable).where(eq(importacaoPlanejamentoTable.id, input.id))
    return { success: true }
  }),

  getProfessores: adminProtectedProcedure.query(async ({ ctx }) => {
    const professores = await ctx.db.query.professorTable.findMany({
      columns: {
        id: true,
        nomeCompleto: true,
        matriculaSiape: true,
        emailInstitucional: true,
      },
      with: {
        departamento: {
          columns: {
            nome: true,
            sigla: true,
          },
        },
      },
    })

    return professores
  }),

  getDisciplinas: adminProtectedProcedure.query(async ({ ctx }) => {
    const disciplinas = await ctx.db.query.disciplinaTable.findMany({
      columns: {
        id: true,
        nome: true,
        codigo: true,
      },
      with: {
        departamento: {
          columns: {
            nome: true,
            sigla: true,
          },
        },
      },
    })

    return disciplinas
  }),
})
