import { db } from '@/server/db'
import { projetoTable } from '@/server/db/schema'
import { ConsolidacaoValidacaoChefeTemplate } from '@/server/lib/pdfTemplates/consolidacao-validacao-chefe'
import { ResultadoSelecaoTemplate } from '@/server/lib/pdfTemplates/resultado-selecao'
import { createSelecaoService } from '@/server/services/selecao/selecao-service'
import { ADMIN, type AtaSelecaoData, type Semestre } from '@/types'
import { logger } from '@/utils/logger'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { and, eq, gte } from 'drizzle-orm'
import { PDFDocument } from 'pdf-lib'
import React, { type ReactElement } from 'react'

const log = logger.child({ context: 'ConsolidacaoPDFService' })

const toDocumentElement = (element: ReactElement): ReactElement<DocumentProps> => {
  return element as ReactElement<DocumentProps>
}

export function createConsolidacaoPDFService() {
  const selecaoService = createSelecaoService(db)

  return {
    /**
     * Generates a single merged PDF containing:
     * 1. Official Department Validation & Signature cover page
     * 2. All "Resultado Seleção" PDF pages for subjects with Bolsistas in that semester
     */
    async generateConsolidatedResultadosPDF(input: {
      ano: number
      semestre: Semestre
      chefeNome?: string | null
      chefeAssinatura?: string | null
      chefeAssinouEm?: Date | null
      adminUserId: number
    }): Promise<Buffer> {
      const { ano, semestre, chefeNome, chefeAssinatura, chefeAssinouEm, adminUserId } = input

      log.info({ ano, semestre }, 'Gerando PDF consolidado de resultados com bolsistas')

      // Find all approved projects for this semester with bolsasDisponibilizadas > 0
      const projects = await db
        .select()
        .from(projetoTable)
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            eq(projetoTable.status, 'APPROVED'),
            gte(projetoTable.bolsasDisponibilizadas, 1)
          )
        )

      if (projects.length === 0) {
        log.warn({ ano, semestre }, 'Nenhum projeto com bolsistas encontrado para o período')
      }

      const mergedPdf = await PDFDocument.create()

      // 1. Render validation page (Termo de Validação do Chefe)
      const validacaoElement = toDocumentElement(
        React.createElement(ConsolidacaoValidacaoChefeTemplate, {
          data: {
            ano,
            semestre: semestre === 'SEMESTRE_1' ? '1' : '2',
            chefeNome,
            chefeAssinatura,
            chefeAssinouEm,
            totalProjetosBolsistas: projects.length,
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

          const resultadoElement = toDocumentElement(
            React.createElement(ResultadoSelecaoTemplate, { data: ataData, tipo: 'BOLSISTA' })
          )

          const resultadoBuffer = await renderToBuffer(resultadoElement)
          const resultadoPdf = await PDFDocument.load(resultadoBuffer)
          const copiedPages = await mergedPdf.copyPages(resultadoPdf, resultadoPdf.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        } catch (error) {
          log.error(
            { error, projetoId: proj.id },
            'Erro ao gerar Resultado Seleção de projeto individual para consolidação'
          )
        }
      }

      const mergedBuffer = Buffer.from(await mergedPdf.save())
      log.info({ size: mergedBuffer.length, totalProjetos: projects.length }, 'PDF consolidado gerado com sucesso')
      return mergedBuffer
    },
  }
}
