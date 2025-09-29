import { adminProtectedProcedure, createTRPCRouter } from '@/server/api/trpc'
import {
  atividadeProjetoTable,
  disciplinaProfessorResponsavelTable,
  disciplinaTable,
  importacaoPlanejamentoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  projetoTemplateTable,
  type NewProjeto,
} from '@/server/db/schema'
import { sendProjectCreationNotification } from '@/server/lib/email-service'
import minioClient, { bucketName as MINIO_BUCKET } from '@/server/lib/minio'
import { parsePlanejamentoSpreadsheet, validateSpreadsheetStructure } from '@/server/lib/spreadsheet-parser'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { processImportedFileDCC } from './process-dcc'

const log = logger.child({ context: 'ImportProjectsRouter' })

export const importProjectsRouter = createTRPCRouter({
  /**
   * Upload do arquivo de planejamento
   */
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
      try {
        // Baixar arquivo do MinIO para validar
        const stream = await minioClient.getObject(MINIO_BUCKET, input.fileId)
        const chunks: Buffer[] = []

        await new Promise<void>((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk))
          stream.on('end', () => resolve())
          stream.on('error', reject)
        })

        const fileBuffer = Buffer.concat(chunks)

        // Validar estrutura da planilha
        const validation = validateSpreadsheetStructure(fileBuffer)
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Planilha inválida: ${validation.message}`,
          })
        }

        // Criar registro de importação
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

        log.info({ importacaoId: importacao[0].id }, 'Importação criada, iniciando processamento')

        return importacao[0]
      } catch (error) {
        log.error(error, 'Erro ao fazer upload do arquivo')
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao processar arquivo de planejamento',
        })
      }
    }),

  /**
   * Processar arquivo importado (formato DCC - busca por nome)
   */
  processImportedFileDCC: adminProtectedProcedure
    .input(z.object({ importacaoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await processImportedFileDCC(input.importacaoId, ctx)
    }),

  /**
   * Processar arquivo importado e criar projetos (formato genérico - busca por SIAPE)
   */
  processImportedFile: adminProtectedProcedure
    .input(
      z.object({
        importacaoId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now()
      const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes timeout

      let projetosCriados = 0
      let projetosComErro = 0
      const erros: string[] = []
      const warnings: string[] = []
      const professoresNotificar = new Set<number>() // IDs dos professores para notificar

      try {
        // Buscar importação
        const importacao = await ctx.db.query.importacaoPlanejamentoTable.findFirst({
          where: eq(importacaoPlanejamentoTable.id, input.importacaoId),
        })

        if (!importacao) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Importação não encontrada' })
        }

        if (importacao.status !== 'PROCESSANDO') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Importação não está em processamento' })
        }

        // Baixar e parsear arquivo
        const stream = await minioClient.getObject(MINIO_BUCKET, importacao.fileId)
        const chunks: Buffer[] = []

        await new Promise<void>((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk))
          stream.on('end', () => resolve())
          stream.on('error', reject)
        })

        const fileBuffer = Buffer.concat(chunks)
        const parsed = await parsePlanejamentoSpreadsheet(fileBuffer)

        // Adicionar warnings do parser
        warnings.push(...parsed.warnings)
        erros.push(...parsed.errors)

        log.info(
          {
            totalLinhas: parsed.rows.length,
            warnings: parsed.warnings.length,
            errors: parsed.errors.length,
          },
          'Planilha parseada'
        )

        // Processar cada linha
        for (const row of parsed.rows) {
          // Verificar timeout
          if (Date.now() - startTime > TIMEOUT_MS) {
            erros.push('Timeout: Importação cancelada devido ao tempo limite excedido')
            break
          }

          try {
            // Buscar disciplina
            const disciplina = await ctx.db.query.disciplinaTable.findFirst({
              where: eq(disciplinaTable.codigo, row.disciplinaCodigo),
            })

            if (!disciplina) {
              erros.push(`Disciplina ${row.disciplinaCodigo} (${row.disciplinaNome}) não encontrada no sistema`)
              projetosComErro++
              continue
            }

            // Buscar professores
            const professores = await ctx.db.query.professorTable.findMany({
              where: inArray(professorTable.matriculaSiape, row.professoresSiapes),
              with: {
                user: {
                  columns: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            })

            if (professores.length === 0) {
              erros.push(
                `Nenhum professor encontrado para ${row.disciplinaCodigo}: SIAPEs ${row.professoresSiapes.join(', ')}`
              )
              projetosComErro++
              continue
            }

            // Avisar se nem todos os professores foram encontrados
            if (professores.length < row.professoresSiapes.length) {
              const encontrados = professores.map((p) => p.matriculaSiape)
              const naoEncontrados = row.professoresSiapes.filter((s) => !encontrados.includes(s))
              warnings.push(
                `Disciplina ${row.disciplinaCodigo}: Professores não encontrados: ${naoEncontrados.join(', ')}`
              )
            }

            // Determinar tipo: INDIVIDUAL ou COLETIVA
            const tipoProposicao = professores.length > 1 ? 'COLETIVA' : 'INDIVIDUAL'

            // Professor responsável (primeiro da lista)
            const professorResponsavel = professores[0]

            // Buscar template da disciplina
            const template = await ctx.db.query.projetoTemplateTable.findFirst({
              where: eq(projetoTemplateTable.disciplinaId, disciplina.id),
            })

            let titulo = row.disciplinaNome
            let descricao = `Projeto de monitoria para ${row.disciplinaNome}`
            let cargaHorariaSemana = 12
            let numeroSemanas = 17
            let publicoAlvo = 'Estudantes do curso'
            let atividades: string[] = []
            let professoresParticipantes: string | null = null

            // Se encontrou template, usar dados dele
            if (template) {
              titulo = template.tituloDefault || titulo
              descricao = template.descricaoDefault || descricao
              cargaHorariaSemana = template.cargaHorariaSemanaDefault || cargaHorariaSemana
              numeroSemanas = template.numeroSemanasDefault || numeroSemanas
              publicoAlvo = template.publicoAlvoDefault || publicoAlvo

              if (template.atividadesDefault) {
                try {
                  atividades = JSON.parse(template.atividadesDefault)
                } catch {
                  // Se não for JSON válido, dividir por ponto-e-vírgula
                  atividades = template.atividadesDefault.split(';').filter((a) => a.trim().length > 0)
                }
              }

              log.info({ disciplinaId: disciplina.id, templateId: template.id }, 'Template encontrado e aplicado')
            } else {
              warnings.push(`Disciplina ${row.disciplinaCodigo}: Sem template cadastrado, usando valores padrão`)
            }

            // Se é COLETIVA, montar lista de professores participantes
            if (tipoProposicao === 'COLETIVA') {
              professoresParticipantes = professores.map((p) => p.nomeCompleto).join(', ')
            }

            // Criar projeto
            const novoProjeto: NewProjeto = {
              titulo,
              descricao,
              professorResponsavelId: professorResponsavel.id,
              departamentoId: professorResponsavel.departamentoId,
              disciplinaNome: row.disciplinaNome,
              ano: importacao.ano,
              semestre: importacao.semestre,
              cargaHorariaSemana,
              numeroSemanas,
              publicoAlvo,
              bolsasSolicitadas: row.vagas || 0,
              voluntariosSolicitados: 0,
              tipoProposicao,
              professoresParticipantes,
              status: 'PENDING_PROFESSOR_SIGNATURE',
            }

            const [projeto] = await ctx.db.insert(projetoTable).values(novoProjeto).returning()

            // Associar disciplina ao projeto
            await ctx.db.insert(projetoDisciplinaTable).values({
              projetoId: projeto.id,
              disciplinaId: disciplina.id,
            })

            // Associar professor responsável à disciplina para este semestre
            const existingAssociation = await ctx.db.query.disciplinaProfessorResponsavelTable.findFirst({
              where: and(
                eq(disciplinaProfessorResponsavelTable.disciplinaId, disciplina.id),
                eq(disciplinaProfessorResponsavelTable.professorId, professorResponsavel.id),
                eq(disciplinaProfessorResponsavelTable.ano, importacao.ano),
                eq(disciplinaProfessorResponsavelTable.semestre, importacao.semestre)
              ),
            })

            if (!existingAssociation) {
              await ctx.db.insert(disciplinaProfessorResponsavelTable).values({
                disciplinaId: disciplina.id,
                professorId: professorResponsavel.id,
                ano: importacao.ano,
                semestre: importacao.semestre,
              })
            }

            // Adicionar atividades se existirem
            if (atividades.length > 0) {
              const atividadesData = atividades.map((descricao) => ({
                projetoId: projeto.id,
                descricao,
              }))
              await ctx.db.insert(atividadeProjetoTable).values(atividadesData)
            }

            // Adicionar todos os professores para notificar
            professores.forEach((p) => professoresNotificar.add(p.userId))

            projetosCriados++
            log.info(
              {
                projetoId: projeto.id,
                disciplina: row.disciplinaCodigo,
                tipo: tipoProposicao,
                professores: professores.length,
              },
              'Projeto criado'
            )
          } catch (error) {
            erros.push(
              `Erro ao criar projeto para ${row.disciplinaCodigo}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            )
            projetosComErro++
          }
        }

        // Determinar status final
        let finalStatus = 'CONCLUIDO'
        if (erros.some((erro) => erro.includes('Timeout'))) {
          finalStatus = 'ERRO'
        } else if (projetosComErro > 0 && projetosCriados === 0) {
          finalStatus = 'ERRO'
        } else if (projetosComErro > 0) {
          finalStatus = 'CONCLUIDO_COM_ERROS'
        }

        // Atualizar importação
        await ctx.db
          .update(importacaoPlanejamentoTable)
          .set({
            totalProjetos: parsed.rows.length,
            projetosCriados,
            projetosComErro,
            status: finalStatus,
            erros: erros.length > 0 || warnings.length > 0 ? JSON.stringify({ erros, warnings }) : null,
          })
          .where(eq(importacaoPlanejamentoTable.id, input.importacaoId))

        // Enviar emails para professores se houver projetos criados
        if (projetosCriados > 0 && professoresNotificar.size > 0) {
          try {
            const professoresParaNotificar = await ctx.db.query.professorTable.findMany({
              where: inArray(professorTable.userId, Array.from(professoresNotificar)),
              with: {
                user: {
                  columns: {
                    email: true,
                    username: true,
                  },
                },
              },
            })

            for (const professor of professoresParaNotificar) {
              try {
                await sendProjectCreationNotification({
                  to: professor.user.email,
                  professorName: professor.nomeCompleto,
                  ano: importacao.ano,
                  semestre: importacao.semestre,
                })

                log.info({ professorId: professor.id, email: professor.user.email }, 'Email enviado')
              } catch (emailError) {
                log.error(emailError, 'Erro ao enviar email para professor')
                warnings.push(`Erro ao enviar email para ${professor.user.email}`)
              }
            }

            log.info({ totalProfessores: professoresParaNotificar.length }, 'Emails de notificação enviados')
          } catch (error) {
            log.error(error, 'Erro ao enviar emails de notificação')
            warnings.push('Erro ao enviar emails de notificação para professores')
          }
        }

        log.info(
          {
            importacaoId: input.importacaoId,
            projetosCriados,
            projetosComErro,
            emailsEnviados: professoresNotificar.size,
          },
          'Importação finalizada'
        )

        return {
          projetosCriados,
          projetosComErro,
          erros,
          warnings,
          emailsEnviados: professoresNotificar.size,
        }
      } catch (error) {
        log.error(error, 'Erro ao processar importação')

        // Marcar importação como erro
        await ctx.db
          .update(importacaoPlanejamentoTable)
          .set({
            status: 'ERRO',
            erros: JSON.stringify({
              erros: [`Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
              warnings,
            }),
          })
          .where(eq(importacaoPlanejamentoTable.id, input.importacaoId))

        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao processar importação',
        })
      }
    }),

  /**
   * Histórico de importações
   */
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
      erros: imp.erros ? JSON.parse(imp.erros) : { erros: [], warnings: [] },
      importadoPor: imp.importadoPor,
      createdAt: imp.createdAt,
    }))
  }),

  /**
   * Detalhes de uma importação
   */
  getImportDetails: adminProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const importacao = await ctx.db.query.importacaoPlanejamentoTable.findFirst({
      where: eq(importacaoPlanejamentoTable.id, input.id),
      with: {
        importadoPor: true,
      },
    })

    if (!importacao) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Importação não encontrada' })
    }

    return {
      ...importacao,
      erros: importacao.erros ? JSON.parse(importacao.erros) : { erros: [], warnings: [] },
    }
  }),

  /**
   * Deletar importação
   */
  deleteImport: adminProtectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    await ctx.db.delete(importacaoPlanejamentoTable).where(eq(importacaoPlanejamentoTable.id, input.id))
    return { success: true }
  }),

  /**
   * Listar professores (helper)
   */
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

  /**
   * Listar disciplinas (helper)
   */
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
