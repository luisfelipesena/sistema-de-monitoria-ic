import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { createTRPCRouter, adminProtectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'
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
      const importacao = await db
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
    .mutation(async ({ input }) => {
      let projetosCriados = 0
      let projetosComErro = 0
      const erros: string[] = []

      for (const projetoData of input.projetos) {
        try {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.matriculaSiape, projetoData.professorSiape),
            with: { departamento: true },
          })

          if (!professor) {
            erros.push(`Professor com SIAPE ${projetoData.professorSiape} não encontrado`)
            projetosComErro++
            continue
          }

          const disciplina = await db.query.disciplinaTable.findFirst({
            where: eq(disciplinaTable.codigo, projetoData.disciplinaCodigo),
          })

          if (!disciplina) {
            erros.push(`Disciplina ${projetoData.disciplinaCodigo} não encontrada`)
            projetosComErro++
            continue
          }

          const importacao = await db.query.importacaoPlanejamentoTable.findFirst({
            where: eq(importacaoPlanejamentoTable.id, input.importacaoId),
          })

          if (!importacao) {
            throw new Error('Importação não encontrada')
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

          const [projeto] = await db.insert(projetoTable).values(novoProjeto).returning()

          await db.insert(projetoDisciplinaTable).values({
            projetoId: projeto.id,
            disciplinaId: disciplina.id,
          })

          if (projetoData.atividades && projetoData.atividades.length > 0) {
            const atividades = projetoData.atividades.map((descricao) => ({
              projetoId: projeto.id,
              descricao,
            }))
            await db.insert(atividadeProjetoTable).values(atividades)
          }

          projetosCriados++
        } catch (error) {
          erros.push(
            `Erro ao criar projeto "${projetoData.titulo}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          )
          projetosComErro++
        }
      }

      await db
        .update(importacaoPlanejamentoTable)
        .set({
          totalProjetos: input.projetos.length,
          projetosCriados,
          projetosComErro,
          status: projetosComErro > 0 ? 'CONCLUIDO_COM_ERROS' : 'CONCLUIDO',
          erros: erros.length > 0 ? JSON.stringify(erros) : null,
        })
        .where(eq(importacaoPlanejamentoTable.id, input.importacaoId))

      return {
        projetosCriados,
        projetosComErro,
        erros,
      }
    }),

  getImportHistory: adminProtectedProcedure.query(async () => {
    const imports = await db.query.importacaoPlanejamentoTable.findMany({
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

  getImportDetails: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const importacao = await db.query.importacaoPlanejamentoTable.findFirst({
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

  deleteImport: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.delete(importacaoPlanejamentoTable).where(eq(importacaoPlanejamentoTable.id, input.id))
    return { success: true }
  }),

  getProfessores: adminProtectedProcedure.query(async () => {
    const professores = await db.query.professorTable.findMany({
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

  getDisciplinas: adminProtectedProcedure.query(async () => {
    const disciplinas = await db.query.disciplinaTable.findMany({
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
