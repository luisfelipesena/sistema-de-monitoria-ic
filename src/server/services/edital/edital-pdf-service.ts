import { NotFoundError } from '@/server/lib/errors'
import minioClient, { bucketName } from '@/server/lib/minio'
import { EditalInternoTemplate, type EditalInternoData } from '@/server/lib/pdfTemplates/edital-interno'
import { TIPO_PROPOSICAO_INDIVIDUAL } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { renderToBuffer } from '@react-pdf/renderer'
import type { EditalRepository } from './edital-repository'

const log = logger.child({ context: 'EditalPdfService' })

export function createEditalPdfService(repo: EditalRepository) {
  return {
    async generateEditalPdf(id: number, userId: number) {
      const edital = await repo.findByIdWithRelations(id)
      if (!edital || !edital.periodoInscricao) {
        throw new NotFoundError('Edital ou período de inscrição', id)
      }

      const [projetos, equivalencias] = await Promise.all([
        repo.findApprovedProjectsByPeriod(edital.periodoInscricao.ano, edital.periodoInscricao.semestre),
        repo.findAllEquivalencias(),
      ])

      // Get discipline IDs from projects to filter relevant equivalencias and fetch templates
      const disciplinaIds = new Set<number>()
      projetos.forEach((projeto) => {
        projeto.disciplinas.forEach((d) => {
          disciplinaIds.add(d.disciplina.id)
        })
      })

      // Fetch templates for fallback of pontosProva/bibliografia
      const templates = await repo.findTemplatesByDisciplinaIds(Array.from(disciplinaIds))
      const templateByDisciplinaId = new Map(templates.map((t) => [t.disciplinaId, t]))

      // Filter equivalencias that are relevant to the edital disciplines
      const relevantEquivalencias = equivalencias.filter(
        (eq) => disciplinaIds.has(eq.disciplinaOrigemId) || disciplinaIds.has(eq.disciplinaEquivalenteId)
      )

      const editalData: EditalInternoData = {
        numeroEdital: edital.numeroEdital,
        ano: edital.periodoInscricao.ano,
        semestre: edital.periodoInscricao.semestre,
        titulo: edital.titulo,
        descricao: edital.descricaoHtml || undefined,
        periodoInscricao: {
          dataInicio: edital.periodoInscricao.dataInicio.toISOString(),
          dataFim: edital.periodoInscricao.dataFim.toISOString(),
        },
        formularioInscricaoUrl:
          edital.linkFormularioInscricao || `${env.NEXT_PUBLIC_APP_URL}/student/inscricao-monitoria`,
        dataDivulgacao: edital.dataDivulgacaoResultado?.toISOString(),
        chefeResponsavel: {
          nome: 'Chefe do Departamento de Ciência da Computação',
          cargo: 'Chefe do Departamento de Ciência da Computação',
          assinatura: edital.chefeAssinatura || undefined,
        },
        disciplinas: projetos.map((projeto) => {
          const disciplinaId = projeto.disciplinas[0]?.disciplina.id
          const template = disciplinaId ? templateByDisciplinaId.get(disciplinaId) : undefined

          // Pontos de prova: project value → template fallback → undefined
          const pontosRaw = projeto.pontosProva || template?.pontosProvaDefault
          const pontosSelecao = pontosRaw ? pontosRaw.split('\n').filter((p) => p.trim()) : undefined

          // Bibliografia: project value → template fallback → undefined
          const bibRaw = projeto.bibliografia || template?.bibliografiaDefault
          const bibliografia = bibRaw ? bibRaw.split('\n').filter((b) => b.trim()) : undefined

          return {
            codigo: projeto.disciplinas[0]?.disciplina.codigo || 'MON',
            nome: projeto.disciplinas[0]?.disciplina.nome || projeto.titulo,
            professor: {
              nome: projeto.professorResponsavel.nomeCompleto,
              email: projeto.professorResponsavel.user.email,
            },
            tipoMonitoria: TIPO_PROPOSICAO_INDIVIDUAL,
            numBolsistas: projeto.bolsasDisponibilizadas ?? 0,
            // Only show volunteers in PDF if professor confirmed them
            numVoluntarios: projeto.voluntariosConfirmados ? (projeto.voluntariosSolicitados ?? 0) : 0,
            voluntariosConfirmados: projeto.voluntariosConfirmados ?? false,
            // Req 5.2, 5.4: pontos/bibliografia with template fallback for section 6.3
            pontosSelecao: pontosSelecao && pontosSelecao.length > 0 ? pontosSelecao : undefined,
            bibliografia: bibliografia && bibliografia.length > 0 ? bibliografia : undefined,
            // Req 5.1, 5.3: dataSelecao only set when dataSelecaoEscolhida is non-null (section 6.2.3)
            dataSelecao: projeto.dataSelecaoEscolhida?.toISOString(),
            horarioSelecao: projeto.horarioSelecao || undefined,
            datasSelecao: (() => {
              // Try new multi-slot field first
              const raw = (projeto as Record<string, unknown>).datasSelecaoEscolhidas as string | null
              if (raw) {
                try {
                  const parsed = JSON.parse(raw)
                  if (Array.isArray(parsed) && parsed.length > 0) return parsed
                } catch { /* fall through */ }
              }
              // Fallback to legacy single slot
              if (projeto.dataSelecaoEscolhida && projeto.horarioSelecao) {
                return [{ data: projeto.dataSelecaoEscolhida.toISOString().split('T')[0], horario: projeto.horarioSelecao }]
              }
              return undefined
            })(),
            localSelecao: projeto.localSelecao || undefined,
          }
        }),
        equivalencias:
          relevantEquivalencias.length > 0
            ? relevantEquivalencias.map((eq) => ({
                disciplina1: `${eq.disciplinaOrigem.codigo} - ${eq.disciplinaOrigem.nome}`,
                disciplina2: `${eq.disciplinaEquivalente.codigo} - ${eq.disciplinaEquivalente.nome}`,
              }))
            : undefined,
      }

      const pdfBuffer = await renderToBuffer(EditalInternoTemplate({ data: editalData }))
      const timestamp = Date.now()
      const fileName = `editais/edital-${edital.numeroEdital}-${edital.periodoInscricao.ano}-${edital.periodoInscricao.semestre}-${timestamp}.pdf`

      await minioClient.putObject(bucketName, fileName, pdfBuffer, pdfBuffer.length, {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      })

      const presignedUrl = await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60)

      log.info({ editalId: id, fileName, userId }, 'PDF do edital gerado')
      return { url: presignedUrl }
    },
  }
}

export type EditalPdfService = ReturnType<typeof createEditalPdfService>
