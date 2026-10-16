import { db } from '@/server/db'
import { projetoTable, vagaTable } from '@/server/db/schema'
import { ConsolidacaoValidacaoChefeTemplate } from '@/server/lib/pdfTemplates/consolidacao-validacao-chefe'
import { getCandidatosAprovados, ResultadoSelecaoTemplate } from '@/server/lib/pdfTemplates/resultado-selecao'
import { createSelecaoService } from '@/server/services/selecao/selecao-service'
import { ADMIN, type AtaSelecaoData, type Semestre, type TipoVaga } from '@/types'
import { ValidationError } from '@/server/lib/errors'
import { logger } from '@/utils/logger'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { and, eq, gte, isNull, or, sql } from 'drizzle-orm'
import { PDFDocument } from 'pdf-lib'
import React, { type ReactElement } from 'react'

const log = logger.child({ context: 'ConsolidacaoPDFService' })

const toDocumentElement = (element: ReactElement): ReactElement<DocumentProps> => {
  return element as ReactElement<DocumentProps>
}

export function createConsolidacaoPDFService() {
  const selecaoService = createSelecaoService(db)

  return {
    async generateConsolidatedResultadosPDF(input: {
      ano: number
      semestre: Semestre
      tipo: TipoVaga
      chefeNome?: string | null
      chefeAssinatura?: string | null
      chefeAssinouEm?: Date | null
      adminUserId: number
    }): Promise<Buffer> {
      const { ano, semestre, tipo, chefeNome, chefeAssinatura, chefeAssinouEm, adminUserId } = input

      log.info({ ano, semestre, tipo }, 'Gerando PDF consolidado de resultados')

      const projects = await db
        .select()
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            eq(projetoTable.status, 'APPROVED'),
            isNull(projetoTable.deletedAt),
            tipo === 'BOLSISTA' ? gte(projetoTable.bolsasDisponibilizadas, 1) : or(
              gte(projetoTable.voluntariosSolicitados, 1),
              sql`exists (select 1 from ${vagaTable} where ${vagaTable.projetoId} = ${projetoTable.id} and ${vagaTable.tipo} = ${tipo})`
            )
          )
        )

      if (projects.length === 0) {
        log.warn({ ano, semestre, tipo }, 'Nenhum projeto encontrado para a modalidade no período')
      }

      const mergedPdf = await PDFDocument.create()
      let totalProjetos = 0

      // 1. Render validation page (Termo de Validação do Chefe)
      const validacaoElement = toDocumentElement(
        React.createElement(ConsolidacaoValidacaoChefeTemplate, {
          data: {
            ano,
            semestre: semestre === 'SEMESTRE_1' ? '1' : '2',
            chefeNome,
            chefeAssinatura,
            chefeAssinouEm,
            tipo,
          },
        })
      )

      const validacaoBuffer = await renderToBuffer(validacaoElement)
      const validacaoPdf = await PDFDocument.load(validacaoBuffer)
      const validacaoPages = await mergedPdf.copyPages(validacaoPdf, validacaoPdf.getPageIndices())
      validacaoPages.forEach((page) => mergedPdf.addPage(page))

      // 2. Render each project's Resultado Seleção PDF and append pages
      for (const proj of projects) {
        try {
          const rawAtaData = await selecaoService.generateAtaData({
            projetoId: proj.id.toString(),
            userId: adminUserId,
            userRole: ADMIN,
          })

          const ataData: AtaSelecaoData = {
            ...rawAtaData,
            projeto: {
              ...rawAtaData.projeto,
              departamento: rawAtaData.projeto.departamento || { nome: 'N/A', sigla: null },
            },
            candidatos: [...rawAtaData.inscricoesBolsista, ...rawAtaData.inscricoesVoluntario].map((c) => ({
              id: c.id,
              aluno: c.aluno,
              tipoVagaPretendida: c.tipoVagaPretendida,
              notaDisciplina: c.notaDisciplina ? Number(c.notaDisciplina) : null,
              notaSelecao: c.notaSelecao ? Number(c.notaSelecao) : null,
              coeficienteRendimento: c.coeficienteRendimento ? Number(c.coeficienteRendimento) : null,
              notaFinal: c.notaFinal ? Number(c.notaFinal) : null,
              status: c.status,
              observacoes: c.feedbackProfessor,
            })),
            ataInfo: {
              dataSelecao: new Date().toLocaleDateString('pt-BR'),
              localSelecao: 'Online via Sistema de Monitoria',
              observacoes: 'Processo seletivo concluído.',
            },
          }

          if (getCandidatosAprovados(ataData, tipo).length === 0) continue

          const resultadoElement = toDocumentElement(
            React.createElement(ResultadoSelecaoTemplate, { data: ataData, tipo })
          )

          const resultadoBuffer = await renderToBuffer(resultadoElement)
          const resultadoPdf = await PDFDocument.load(resultadoBuffer)
          const copiedPages = await mergedPdf.copyPages(resultadoPdf, resultadoPdf.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
          totalProjetos++
        } catch (error) {
          log.error(
            { error, projetoId: proj.id },
            'Erro ao gerar Resultado Seleção de projeto individual para consolidação'
          )
          throw error
        }
      }

      if (totalProjetos === 0) {
        throw new ValidationError('Nenhum candidato aprovado encontrado para a modalidade e o período selecionados.')
      }

      const mergedBuffer = Buffer.from(await mergedPdf.save())
      log.info({ size: mergedBuffer.length, totalProjetos }, 'PDF consolidado gerado com sucesso')
      return mergedBuffer
    },
  }
}
