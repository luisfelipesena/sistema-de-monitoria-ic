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

      // Get discipline IDs from projects to filter relevant equivalencias
      const disciplinaIds = new Set<number>()
      projetos.forEach((projeto) => {
        projeto.disciplinas.forEach((d) => {
          disciplinaIds.add(d.disciplina.id)
        })
      })

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
          nome: 'Prof. Dr. [Nome do Chefe]',
          cargo: 'Chefe do Departamento de Ciência da Computação',
        },
        disciplinas: projetos.map((projeto) => ({
          codigo: projeto.disciplinas[0]?.disciplina.codigo || 'MON',
          nome: projeto.disciplinas[0]?.disciplina.nome || projeto.titulo,
          professor: {
            nome: projeto.professorResponsavel.nomeCompleto,
            email: projeto.professorResponsavel.user.email,
          },
          tipoMonitoria: TIPO_PROPOSICAO_INDIVIDUAL,
          numBolsistas: projeto.bolsasDisponibilizadas || 0,
          numVoluntarios: projeto.voluntariosSolicitados || 0,
          pontosSelecao: projeto.pontosProva ? projeto.pontosProva.split('\n').filter((p) => p.trim()) : undefined,
          bibliografia: projeto.bibliografia ? projeto.bibliografia.split('\n').filter((b) => b.trim()) : undefined,
          dataSelecao: projeto.dataSelecaoEscolhida?.toISOString(),
          horarioSelecao: projeto.horarioSelecao || undefined,
          localSelecao: projeto.localSelecao || undefined,
        })),
        equivalencias:
          relevantEquivalencias.length > 0
            ? relevantEquivalencias.map((eq) => ({
                disciplina1: `${eq.disciplinaOrigem.codigo} - ${eq.disciplinaOrigem.nome}`,
                disciplina2: `${eq.disciplinaEquivalente.codigo} - ${eq.disciplinaEquivalente.nome}`,
              }))
            : undefined,
      }

      const pdfBuffer = await renderToBuffer(EditalInternoTemplate({ data: editalData }))
      const fileName = `editais/edital-${edital.numeroEdital}-${edital.periodoInscricao.ano}-${edital.periodoInscricao.semestre}.pdf`

      await minioClient.putObject(bucketName, fileName, pdfBuffer, pdfBuffer.length, {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'max-age=3600',
      })

      const presignedUrl = await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60)

      log.info({ editalId: id, fileName, userId }, 'PDF do edital gerado')
      return { url: presignedUrl }
    },
  }
}

export type EditalPdfService = ReturnType<typeof createEditalPdfService>
