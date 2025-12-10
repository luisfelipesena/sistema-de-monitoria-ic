import { BusinessError } from "@/server/lib/errors"
import minioClient from "@/server/lib/minio"
import { TermoCompromissoTemplate, type TermoCompromissoProps } from "@/server/lib/pdfTemplates/termo"
import { SEMESTRE_1, TIPO_ASSINATURA_ATA_SELECAO, TIPO_ASSINATURA_TERMO_COMPROMISSO } from "@/types"
import { logger } from "@/utils/logger"
import { renderToBuffer } from "@react-pdf/renderer"
import { PDFDocument } from "pdf-lib"

const log = logger.child({ context: "TermosPdfGenerator" })

const ERROR_CODES = {
  pdfGenerationFailed: "PDF_GENERATION_FAILED",
  minioUploadFailed: "MINIO_UPLOAD_FAILED",
  minioDownloadFailed: "MINIO_DOWNLOAD_FAILED",
  minioPresignedFailed: "MINIO_PRESIGNED_URL_FAILED",
  pdfSignatureFailed: "PDF_SIGNATURE_FAILED",
} as const

export type VagaData = {
  id: number
  tipo: string
  dataInicio: Date | null
  projetoId: number
  aluno: {
    user: {
      username: string
      email: string
    }
    matricula: string | null
    rg: string | null
    cpf: string | null
  }
  projeto: {
    ano: number
    semestre: string
    departamento: {
      nome: string
      sigla: string | null
    } | null
    professorResponsavel: {
      nomeCompleto: string
      user: {
        email: string
      }
      matriculaSiape: string | null
    }
    disciplinas: Array<{
      disciplina: {
        nome: string
        codigo: string
      }
    }>
  }
}

export type SignatureData = {
  assinaturaData: string
  tipoAssinatura: string
}

export function createPdfGenerator() {
  return {
    async generateTermo(vagaData: VagaData): Promise<Buffer> {
      const disciplinaPrincipal = vagaData.projeto.disciplinas[0]?.disciplina ?? { nome: "N/A", codigo: "N/A" }

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
                nome: vagaData.projeto.departamento?.nome || "N/A",
                sigla: vagaData.projeto.departamento?.sigla || "IC",
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
            numero: vagaData.projeto.semestre === SEMESTRE_1 ? 1 : 2,
          },
        },
        dataGeracao: new Date(),
      }

      try {
        return await renderToBuffer(<TermoCompromissoTemplate {...termoData} />)
      } catch (error) {
        log.error({ error, vagaId: vagaData.id }, "Erro ao gerar PDF do termo")
        throw new BusinessError("Erro ao gerar termo de compromisso", ERROR_CODES.pdfGenerationFailed)
      }
    },

    generateFileName(ano: number, semestre: string, vagaId: number): string {
      const semestreNumero = semestre === SEMESTRE_1 ? "1" : "2"
      return `termos/TC-${ano}-${semestreNumero}-${vagaId}.pdf`
    },

    generateTermoNumero(ano: number, semestre: string, vagaId: number): string {
      const semestreNumero = semestre === SEMESTRE_1 ? "1" : "2"
      return `TC-${ano}-${semestreNumero}-${vagaId}`
    },

    async uploadToMinio(fileName: string, buffer: Buffer): Promise<void> {
      try {
        await minioClient.putObject("documents", fileName, buffer, buffer.length, {
          "Content-Type": "application/pdf",
        })
      } catch (error) {
        log.error({ error, fileName }, "Erro ao fazer upload do PDF para MinIO")
        throw new BusinessError("Erro ao salvar termo no storage", ERROR_CODES.minioUploadFailed)
      }
    },

    async getFromMinio(fileName: string): Promise<Buffer> {
      try {
        const pdfStream = await minioClient.getObject("documents", fileName)
        const chunks: Buffer[] = []
        for await (const chunk of pdfStream) {
          chunks.push(chunk)
        }
        return Buffer.concat(chunks)
      } catch (error) {
        log.error({ error, fileName }, "Erro ao buscar PDF do MinIO")
        throw new BusinessError("Termo não encontrado no storage", ERROR_CODES.minioDownloadFailed)
      }
    },

    async generatePresignedUrl(fileName: string): Promise<string> {
      try {
        await minioClient.statObject("documents", fileName)
        return await minioClient.presignedGetObject("documents", fileName, 24 * 60 * 60)
      } catch (error) {
        log.error({ error, fileName }, "Erro ao gerar URL pré-assinada")
        throw new BusinessError("Termo não encontrado. Gere o termo primeiro.", ERROR_CODES.minioPresignedFailed)
      }
    },

    async embedSignatures(fileName: string, signatures: SignatureData[]): Promise<void> {
      try {
        const pdfBuffer = await this.getFromMinio(fileName)
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const page = pdfDoc.getPages()[0]

        for (const signature of signatures) {
          const signatureBuffer = Buffer.from(signature.assinaturaData.split(",")[1], "base64")
          const signatureImage = await pdfDoc.embedPng(signatureBuffer)
          const signatureDims = signatureImage.scale(0.25)

          let coords = { x: 0, y: 0 }
          if (signature.tipoAssinatura === TIPO_ASSINATURA_TERMO_COMPROMISSO) {
            coords = { x: 90, y: 155 }
          } else if (signature.tipoAssinatura === TIPO_ASSINATURA_ATA_SELECAO) {
            coords = { x: 330, y: 155 }
          }

          page.drawImage(signatureImage, { ...coords, width: signatureDims.width, height: signatureDims.height })
        }

        const modifiedPdfBytes = await pdfDoc.save()
        await this.uploadToMinio(fileName, Buffer.from(modifiedPdfBytes))
      } catch (error) {
        log.error({ error, fileName }, "Erro ao adicionar assinaturas ao PDF")
        throw new BusinessError("Falha ao assinar o termo digitalmente", ERROR_CODES.pdfSignatureFailed)
      }
    },
  }
}

export type PdfGenerator = ReturnType<typeof createPdfGenerator>
