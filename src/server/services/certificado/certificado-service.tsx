import type { db } from "@/server/db"
import { BusinessError, ForbiddenError, NotFoundError } from "@/server/lib/errors"
import minioClient, { bucketName, ensureBucketExists } from "@/server/lib/minio"
import CertificadoMonitoria, { type CertificadoMonitoriaData } from "@/server/lib/pdfTemplates/certificado-monitoria"
import { ADMIN, PROFESSOR, STUDENT, getSemestreNumero, type Semestre, type UserRole } from "@/types"
import { logger } from "@/utils/logger"
import { renderToBuffer } from "@react-pdf/renderer"
import { v4 as uuidv4 } from "uuid"
import { createCertificadoRepository } from "./certificado-repository"

const log = logger.child({ context: "CertificadoService" })

type Database = typeof db

export function createCertificadoService(db: Database) {
  const repo = createCertificadoRepository(db)

  const generateValidationCode = () => {
    return `CERT-${uuidv4().substring(0, 8).toUpperCase()}`
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return {
    /**
     * Generate a certificate for a specific vaga (monitor position).
     */
    async generateCertificado(
      vagaId: number,
      userId: number,
      userRole: UserRole
    ): Promise<{ url: string; fileName: string; certificadoNumero: string }> {
      const vaga = await repo.findVagaById(vagaId)

      if (!vaga) {
        throw new NotFoundError("Vaga", vagaId)
      }

      // Authorization check
      const isAdmin = userRole === ADMIN
      const isProfessor = userRole === PROFESSOR && vaga.projeto.professorResponsavel.userId === userId
      const isStudent = userRole === STUDENT && vaga.aluno.userId === userId

      if (!isAdmin && !isProfessor && !isStudent) {
        throw new ForbiddenError("Acesso negado para gerar certificado desta vaga")
      }

      // Check if vaga has ended (based on dataFim or semester end)
      // For now, we allow generation if vaga exists
      const today = new Date()
      const dataFim = vaga.dataFim || new Date(vaga.projeto.ano, vaga.projeto.semestre === "SEMESTRE_1" ? 6 : 11, 30)

      if (today < dataFim) {
        log.warn({ vagaId, dataFim }, "Attempting to generate certificate before term end")
        // Allow generation but log warning - admin can override
        if (!isAdmin) {
          throw new BusinessError(
            "O certificado só pode ser gerado após o término do período de monitoria.",
            "TERM_NOT_ENDED"
          )
        }
      }

      // Get department head info
      const chefeDepartamento = await repo.findChefeDepartamento(vaga.projeto.departamentoId)

      // Build certificate data
      const certificadoNumero = `${vaga.projeto.ano}${getSemestreNumero(vaga.projeto.semestre as Semestre)}-${vagaId
        .toString()
        .padStart(4, "0")}`
      const validationCode = generateValidationCode()

      const disciplinas = vaga.projeto.disciplinas.map((pd) => ({
        codigo: pd.disciplina.codigo,
        nome: pd.disciplina.nome,
      }))

      const certificadoData: CertificadoMonitoriaData = {
        monitor: {
          nome: vaga.aluno.nomeCompleto,
          matricula: vaga.aluno.matricula || "N/A",
          cpf: vaga.aluno.cpf || undefined,
        },
        projeto: {
          titulo: vaga.projeto.titulo,
          disciplinas:
            disciplinas.length > 0 ? disciplinas : [{ codigo: "N/A", nome: vaga.projeto.disciplinaNome || "N/A" }],
          ano: vaga.projeto.ano,
          semestre: vaga.projeto.semestre as Semestre,
          cargaHorariaSemana: vaga.projeto.cargaHorariaSemana,
          numeroSemanas: vaga.projeto.numeroSemanas,
        },
        professor: {
          nome: vaga.projeto.professorResponsavel.nomeCompleto,
          matriculaSiape: vaga.projeto.professorResponsavel.matriculaSiape || undefined,
        },
        departamento: {
          nome: vaga.projeto.departamento.nome,
          sigla: vaga.projeto.departamento.sigla || undefined,
        },
        monitoria: {
          tipo: vaga.tipo as "BOLSISTA" | "VOLUNTARIO",
          dataInicio: formatDate(vaga.dataInicio),
          dataFim: formatDate(vaga.dataFim || dataFim),
        },
        certificado: {
          numero: certificadoNumero,
          dataEmissao: formatDate(new Date()),
          validationCode,
        },
        chefeDepartamento: chefeDepartamento
          ? {
              nome: chefeDepartamento.nome,
              cargo: chefeDepartamento.cargo,
            }
          : undefined,
      }

      // Generate PDF
      const pdfBuffer = await renderToBuffer(<CertificadoMonitoria data={certificadoData} />)

      // Upload to MinIO
      await ensureBucketExists()
      const fileName = `certificados/${vaga.projeto.ano}/${vaga.projeto.semestre}/certificado_${vagaId}_${validationCode}.pdf`

      await minioClient.putObject(bucketName, fileName, pdfBuffer, pdfBuffer.length, {
        "Content-Type": "application/pdf",
        "X-Amz-Meta-Vaga-Id": String(vagaId),
        "X-Amz-Meta-Validation-Code": validationCode,
        "X-Amz-Meta-Generated-By": String(userId),
      })

      // Generate presigned URL for download
      const url = await minioClient.presignedGetObject(bucketName, fileName, 60 * 60, {
        "Content-Disposition": `attachment; filename="Certificado_Monitoria_${vaga.aluno.nomeCompleto.replace(
          /\s/g,
          "_"
        )}.pdf"`,
      })

      log.info({ vagaId, certificadoNumero, validationCode, userId }, "Certificate generated successfully")

      return {
        url,
        fileName,
        certificadoNumero,
      }
    },

    /**
     * List vagas eligible for certificate generation for a student.
     */
    async listStudentCertificates(alunoId: number, userId: number, userRole: UserRole) {
      // Get aluno from userId
      const vagas = await repo.findVagasByAlunoId(alunoId)

      // Only show vagas that belong to the current user or if admin
      const filteredVagas = vagas.filter((v) => v.aluno.userId === userId || userRole === ADMIN)

      return filteredVagas.map((vaga) => ({
        vagaId: vaga.id,
        projeto: {
          titulo: vaga.projeto.titulo,
          ano: vaga.projeto.ano,
          semestre: vaga.projeto.semestre,
        },
        professor: vaga.projeto.professorResponsavel.nomeCompleto,
        departamento: vaga.projeto.departamento.nome,
        tipo: vaga.tipo,
        dataInicio: vaga.dataInicio,
        dataFim: vaga.dataFim,
        elegivel: true, // Could add more logic here
      }))
    },

    /**
     * Generate certificates in batch for a period (admin only).
     */
    async generateBatchCertificates(
      ano: number,
      semestre: Semestre,
      departamentoId: number | undefined,
      userId: number
    ) {
      const vagas = await repo.findCompletedVagasForPeriod(ano, semestre, departamentoId)

      const results: Array<{
        vagaId: number
        alunoNome: string
        success: boolean
        url?: string
        error?: string
      }> = []

      for (const vaga of vagas) {
        try {
          const result = await this.generateCertificado(vaga.id, userId, ADMIN)
          results.push({
            vagaId: vaga.id,
            alunoNome: vaga.aluno.nomeCompleto,
            success: true,
            url: result.url,
          })
        } catch (error) {
          results.push({
            vagaId: vaga.id,
            alunoNome: vaga.aluno.nomeCompleto,
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          })
        }
      }

      return {
        total: vagas.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }
    },

    /**
     * Get certificate preview data without generating PDF.
     */
    async getCertificadoPreview(vagaId: number, userId: number, userRole: UserRole) {
      const vaga = await repo.findVagaById(vagaId)

      if (!vaga) {
        throw new NotFoundError("Vaga", vagaId)
      }

      // Authorization check
      const isAdmin = userRole === ADMIN
      const isProfessor = userRole === PROFESSOR && vaga.projeto.professorResponsavel.userId === userId
      const isStudent = userRole === STUDENT && vaga.aluno.userId === userId

      if (!isAdmin && !isProfessor && !isStudent) {
        throw new ForbiddenError("Acesso negado")
      }

      const disciplinas = vaga.projeto.disciplinas.map((pd) => ({
        codigo: pd.disciplina.codigo,
        nome: pd.disciplina.nome,
      }))

      return {
        monitor: {
          nome: vaga.aluno.nomeCompleto,
          matricula: vaga.aluno.matricula,
        },
        projeto: {
          titulo: vaga.projeto.titulo,
          disciplinas,
          ano: vaga.projeto.ano,
          semestre: vaga.projeto.semestre,
          cargaHorariaTotal: vaga.projeto.cargaHorariaSemana * vaga.projeto.numeroSemanas,
        },
        professor: vaga.projeto.professorResponsavel.nomeCompleto,
        departamento: vaga.projeto.departamento.nome,
        tipo: vaga.tipo,
        periodo: {
          inicio: vaga.dataInicio,
          fim: vaga.dataFim,
        },
      }
    },
  }
}

export type CertificadoService = ReturnType<typeof createCertificadoService>
