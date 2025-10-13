import type { TRPCContext } from '@/server/api/trpc'
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
import getMinioClient, { bucketName as MINIO_BUCKET } from '@/server/lib/minio'
import { groupByDisciplinaTurma, parsePlanejamentoDCC } from '@/server/lib/planejamento-dcc-parser'
import { logger } from '@/utils/logger'
import { TRPCError } from '@trpc/server'
import { and, eq, inArray } from 'drizzle-orm'

const log = logger.child({ context: 'ProcessDCC' })

export async function processImportedFileDCC(importacaoId: number, ctx: TRPCContext) {
  const startTime = Date.now()
  const TIMEOUT_MS = 5 * 60 * 1000

  let projetosCriados = 0
  let projetosComErro = 0
  const erros: string[] = []
  const warnings: string[] = []
  const professoresNotificar = new Set<number>()

  try {
    const importacao = await ctx.db.query.importacaoPlanejamentoTable.findFirst({
      where: eq(importacaoPlanejamentoTable.id, importacaoId),
    })

    if (!importacao) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Importação não encontrada' })
    }

    if (importacao.status !== 'PROCESSANDO') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Importação não está em processamento' })
    }

    // Baixar e parsear arquivo
    const stream = await getMinioClient().getObject(MINIO_BUCKET, importacao.fileId)
    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })

    const fileBuffer = Buffer.concat(chunks)
    const parsed = await parsePlanejamentoDCC(fileBuffer)

    warnings.push(...parsed.warnings)
    erros.push(...parsed.errors)

    log.info(
      {
        totalLinhas: parsed.rows.length,
        warnings: parsed.warnings.length,
        errors: parsed.errors.length,
      },
      'Planilha DCC parseada'
    )

    // Agrupar por disciplina+turma
    const grouped = groupByDisciplinaTurma(parsed.rows)

    // Processar cada disciplina+turma
    for (const [_key, entries] of grouped.entries()) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        erros.push('Timeout: Importação cancelada devido ao tempo limite excedido')
        break
      }

      try {
        const firstEntry = entries[0]

        // Buscar disciplina
        const disciplina = await ctx.db.query.disciplinaTable.findFirst({
          where: eq(disciplinaTable.codigo, firstEntry.disciplinaCodigo),
        })

        if (!disciplina) {
          erros.push(
            `Disciplina ${firstEntry.disciplinaCodigo} (${firstEntry.disciplinaNome}) não encontrada no sistema`
          )
          projetosComErro++
          continue
        }

        // Buscar professores por NOME
        const professoresNomes = entries.map((e) => e.professorNome)
        const professores = []

        for (const nomeProf of professoresNomes) {
          const professor = await ctx.db.query.professorTable.findFirst({
            where: (prof, { ilike, or, eq: eqOp }) =>
              or(
                ilike(prof.nomeCompleto, `%${nomeProf}%`),
                ilike(prof.nomeCompleto, `${nomeProf}%`),
                eqOp(prof.nomeCompleto, nomeProf)
              ),
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

          if (professor) {
            professores.push(professor)
          } else {
            warnings.push(`Professor "${nomeProf}" não encontrado no sistema para ${firstEntry.disciplinaCodigo}`)
          }
        }

        if (professores.length === 0) {
          erros.push(`Nenhum professor encontrado para ${firstEntry.disciplinaCodigo}: ${professoresNomes.join(', ')}`)
          projetosComErro++
          continue
        }

        const tipoProposicao = professores.length > 1 ? 'COLETIVA' : 'INDIVIDUAL'
        const professorResponsavel = professores[0]

        if (!professorResponsavel.departamentoId) {
          erros.push(
            `Disciplina ${firstEntry.disciplinaCodigo}: Professor ${professorResponsavel.nomeCompleto} não possui departamento associado`
          )
          projetosComErro++
          continue
        }

        // Buscar template
        const template = await ctx.db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.disciplinaId, disciplina.id),
        })

        let titulo = firstEntry.disciplinaNome
        let descricao = `Projeto de monitoria para ${firstEntry.disciplinaNome}`
        let cargaHorariaSemana = 12
        let numeroSemanas = 17
        let publicoAlvo = 'Estudantes do curso'
        let atividades: string[] = []
        let professoresParticipantes: string | null = null

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
              atividades = template.atividadesDefault.split(';').filter((a) => a.trim().length > 0)
            }
          }
        } else {
          warnings.push(`Disciplina ${firstEntry.disciplinaCodigo}: Sem template cadastrado, usando valores padrão`)
        }

        if (tipoProposicao === 'COLETIVA') {
          professoresParticipantes = professores.map((p) => p.nomeCompleto).join(', ')
        }

        // Criar projeto
        const novoProjeto: NewProjeto = {
          titulo,
          descricao,
          professorResponsavelId: professorResponsavel.id,
          departamentoId: professorResponsavel.departamentoId,
          disciplinaNome: firstEntry.disciplinaNome,
          ano: importacao.ano,
          semestre: importacao.semestre,
          cargaHorariaSemana,
          numeroSemanas,
          publicoAlvo,
          bolsasSolicitadas: 0,
          voluntariosSolicitados: 0,
          tipoProposicao,
          professoresParticipantes,
          status: 'PENDING_PROFESSOR_SIGNATURE',
        }

        const [projeto] = await ctx.db.insert(projetoTable).values(novoProjeto).returning()

        await ctx.db.insert(projetoDisciplinaTable).values({
          projetoId: projeto.id,
          disciplinaId: disciplina.id,
        })

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

        if (atividades.length > 0) {
          const atividadesData = atividades.map((descricao) => ({
            projetoId: projeto.id,
            descricao,
          }))
          await ctx.db.insert(atividadeProjetoTable).values(atividadesData)
        }

        professores.forEach((p) => professoresNotificar.add(p.userId))

        projetosCriados++
        log.info(
          {
            projetoId: projeto.id,
            disciplina: firstEntry.disciplinaCodigo,
            turma: firstEntry.turma,
            tipo: tipoProposicao,
            professores: professores.length,
          },
          'Projeto criado'
        )
      } catch (error) {
        erros.push(
          `Erro ao criar projeto para ${entries[0].disciplinaCodigo}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        )
        projetosComErro++
      }
    }

    let finalStatus = 'CONCLUIDO'
    if (erros.some((erro) => erro.includes('Timeout'))) {
      finalStatus = 'ERRO'
    } else if (projetosComErro > 0 && projetosCriados === 0) {
      finalStatus = 'ERRO'
    } else if (projetosComErro > 0) {
      finalStatus = 'CONCLUIDO_COM_ERROS'
    }

    await ctx.db
      .update(importacaoPlanejamentoTable)
      .set({
        totalProjetos: grouped.size,
        projetosCriados,
        projetosComErro,
        status: finalStatus,
        erros: erros.length > 0 || warnings.length > 0 ? JSON.stringify({ erros, warnings }) : null,
      })
      .where(eq(importacaoPlanejamentoTable.id, importacaoId))

    // Enviar emails
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
          } catch (emailError) {
            log.error(emailError, 'Erro ao enviar email')
            warnings.push(`Erro ao enviar email para ${professor.user.email}`)
          }
        }
      } catch (error) {
        log.error(error, 'Erro ao enviar emails')
      }
    }

    return {
      projetosCriados,
      projetosComErro,
      erros,
      warnings,
      emailsEnviados: professoresNotificar.size,
    }
  } catch (error) {
    log.error(error, 'Erro ao processar importação DCC')

    await ctx.db
      .update(importacaoPlanejamentoTable)
      .set({
        status: 'ERRO',
        erros: JSON.stringify({
          erros: [`Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
          warnings,
        }),
      })
      .where(eq(importacaoPlanejamentoTable.id, importacaoId))

    if (error instanceof TRPCError) throw error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro ao processar importação DCC',
    })
  }
}
