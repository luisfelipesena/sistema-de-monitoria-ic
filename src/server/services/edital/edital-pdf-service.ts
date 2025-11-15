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

      const projetos = await repo.findApprovedProjectsByPeriod(
        edital.periodoInscricao.ano,
        edital.periodoInscricao.semestre
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
        formularioInscricaoUrl: `${env.NEXT_PUBLIC_APP_URL}/student/inscricao-monitoria`,
        chefeResponsavel: {
          nome: 'Prof. Dr. [Nome do Chefe]',
          cargo: 'Chefe do Departamento de Ciência da Computação',
        },
        disciplinas: projetos.map((projeto) => ({
          codigo: projeto.disciplinas[0]?.disciplina.codigo || 'MON',
          nome: projeto.titulo,
          professor: {
            nome: projeto.professorResponsavel.nomeCompleto,
            email: projeto.professorResponsavel.user.email,
          },
          tipoMonitoria: TIPO_PROPOSICAO_INDIVIDUAL,
          numBolsistas: projeto.bolsasDisponibilizadas || 0,
          numVoluntarios: projeto.voluntariosSolicitados || 0,
          pontosSelecao: ['Conteúdo da disciplina', 'Exercícios práticos', 'Conceitos fundamentais'],
          bibliografia: ['Bibliografia básica da disciplina'],
        })),
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
