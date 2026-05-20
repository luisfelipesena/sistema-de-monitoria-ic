import type { db } from '@/server/db'
import {
  type CreateRelatorioFinalMonitorInput,
  type RelatorioFinalMonitorContent,
  relatorioFinalMonitorContentSchema,
  type UpdateRelatorioFinalMonitorInput,
} from '@/types'
import { BusinessError, ForbiddenError, NotFoundError } from '@/types/errors'
import { createRelatoriosFinaisRepository } from './relatorios-finais-repository'
import { safeJsonParse } from './utils'

type Database = typeof db

/**
 * Service for managing monitor final reports.
 * Handles professor operations (create, update, sign) and student operations (view, sign).
 */
export function createMonitorRelatorioService(database: Database) {
  const repo = createRelatoriosFinaisRepository(database)

  return {
    // ========================================
    // PROFESSOR OPERATIONS
    // ========================================

    /**
     * Gets detailed monitor report (professor view).
     * @throws {NotFoundError} If professor or report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     */
    async getRelatorioMonitor(userId: number, relatorioId: number) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const relatorio = await repo.findRelatorioMonitorById(relatorioId)
      if (!relatorio) {
        throw new NotFoundError('Relatório do Monitor', relatorioId)
      }

      if (relatorio.inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      const conteudo = safeJsonParse<RelatorioFinalMonitorContent>(
        relatorio.conteudo,
        relatorioFinalMonitorContentSchema,
        'conteúdo do relatório do monitor'
      )

      return {
        id: relatorio.id,
        inscricaoId: relatorio.inscricaoId,
        relatorioDisciplinaId: relatorio.relatorioDisciplinaId,
        conteudo,
        status: relatorio.status,
        alunoAssinouEm: relatorio.alunoAssinouEm,
        professorAssinouEm: relatorio.professorAssinouEm,
        inscricao: {
          id: relatorio.inscricao.id,
          aluno: {
            id: relatorio.inscricao.aluno.id,
            nomeCompleto: relatorio.inscricao.aluno.nomeCompleto,
            matricula: relatorio.inscricao.aluno.matricula,
            emailInstitucional: relatorio.inscricao.aluno.emailInstitucional,
          },
          tipoVagaPretendida: relatorio.inscricao.tipoVagaPretendida,
        },
        projeto: {
          id: relatorio.inscricao.projeto.id,
          titulo: relatorio.inscricao.projeto.titulo,
          ano: relatorio.inscricao.projeto.ano,
          semestre: relatorio.inscricao.projeto.semestre,
          disciplinaNome: relatorio.inscricao.projeto.disciplinaNome,
        },
      }
    },

    /**
     * Creates a new monitor report.
     * @throws {NotFoundError} If professor, inscription, or discipline report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report already exists
     */
    async createRelatorioMonitor(userId: number, input: CreateRelatorioFinalMonitorInput) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const inscricao = await repo.findInscricaoById(input.inscricaoId)
      if (!inscricao) {
        throw new NotFoundError('Inscrição', input.inscricaoId)
      }

      if (inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      // Verify relatorioDisciplina exists
      const relatorioDisciplina = await repo.findRelatorioDisciplinaById(input.relatorioDisciplinaId)
      if (!relatorioDisciplina) {
        throw new NotFoundError('Relatório da Disciplina', input.relatorioDisciplinaId)
      }

      // Check if relatorio already exists
      const existing = await repo.findRelatorioMonitorByInscricaoId(input.inscricaoId)
      if (existing) {
        throw new BusinessError('Relatório já existe para este monitor', 'ALREADY_EXISTS')
      }

      const conteudoJson = JSON.stringify(input.conteudo)
      return repo.createRelatorioMonitor({
        inscricaoId: input.inscricaoId,
        relatorioDisciplinaId: input.relatorioDisciplinaId,
        conteudo: conteudoJson,
        status: 'DRAFT',
      })
    },

    /**
     * Updates an existing monitor report.
     * @throws {NotFoundError} If professor or report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report is approved or already signed
     */
    async updateRelatorioMonitor(userId: number, input: UpdateRelatorioFinalMonitorInput) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const relatorio = await repo.findRelatorioMonitorById(input.id)
      if (!relatorio) {
        throw new NotFoundError('Relatório do Monitor', input.id)
      }

      if (relatorio.inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      if (relatorio.status === 'APPROVED') {
        throw new BusinessError('Relatório já aprovado não pode ser editado', 'INVALID_STATUS')
      }

      // Block editing if report is already signed by either party
      if (relatorio.professorAssinouEm || relatorio.alunoAssinouEm) {
        throw new BusinessError('Relatório já assinado não pode ser editado', 'ALREADY_SIGNED')
      }

      const currentConteudo = safeJsonParse<RelatorioFinalMonitorContent>(
        relatorio.conteudo,
        relatorioFinalMonitorContentSchema,
        'conteúdo do relatório do monitor'
      )
      const updatedConteudo = { ...currentConteudo, ...input.conteudo }

      return repo.updateRelatorioMonitor(input.id, {
        conteudo: JSON.stringify(updatedConteudo),
      })
    },

    /**
     * Signs a monitor report as professor.
     * @throws {NotFoundError} If professor or report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report already signed by professor
     */
    async signRelatorioMonitorAsProfessor(userId: number, relatorioId: number) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const relatorio = await repo.findRelatorioMonitorById(relatorioId)
      if (!relatorio) {
        throw new NotFoundError('Relatório do Monitor', relatorioId)
      }

      if (relatorio.inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      if (relatorio.professorAssinouEm) {
        throw new BusinessError('Relatório já foi assinado pelo professor', 'ALREADY_SIGNED')
      }

      return repo.updateRelatorioMonitor(relatorioId, {
        status: 'SUBMITTED',
        professorAssinouEm: new Date(),
      })
    },

    // ========================================
    // STUDENT OPERATIONS
    // ========================================

    /**
     * Lists reports pending student signature.
     * @throws {NotFoundError} If student not found
     */
    async listRelatoriosPendentesParaAluno(userId: number) {
      const aluno = await repo.findAlunoByUserId(userId)
      if (!aluno) {
        throw new NotFoundError('Aluno', userId)
      }

      const relatorios = await repo.listRelatoriosPendentesAssinaturaAluno(aluno.id)

      return relatorios.map((r) => {
        const conteudo = safeJsonParse<RelatorioFinalMonitorContent>(
          r.conteudo,
          relatorioFinalMonitorContentSchema,
          'conteúdo do relatório do monitor'
        )
        return {
          id: r.id,
          relatorioDisciplinaId: r.relatorioDisciplinaId,
          conteudo,
          status: r.status,
          alunoAssinouEm: r.alunoAssinouEm,
          professorAssinouEm: r.professorAssinouEm,
          projeto: {
            id: r.inscricao.projeto.id,
            titulo: r.inscricao.projeto.titulo,
            ano: r.inscricao.projeto.ano,
            semestre: r.inscricao.projeto.semestre,
            disciplinaNome: r.inscricao.projeto.disciplinaNome,
            professorResponsavel: {
              nomeCompleto: r.inscricao.projeto.professorResponsavel.nomeCompleto,
            },
          },
        }
      })
    },

    /**
     * Gets detailed monitor report (student view).
     * @throws {NotFoundError} If student or report not found
     * @throws {ForbiddenError} If report does not belong to student
     */
    async getRelatorioMonitorParaAluno(userId: number, relatorioId: number) {
      const aluno = await repo.findAlunoByUserId(userId)
      if (!aluno) {
        throw new NotFoundError('Aluno', userId)
      }

      const relatorio = await repo.findRelatorioMonitorById(relatorioId)
      if (!relatorio) {
        throw new NotFoundError('Relatório', relatorioId)
      }

      if (relatorio.inscricao.alunoId !== aluno.id) {
        throw new ForbiddenError('Este relatório não pertence a você')
      }

      const conteudo = safeJsonParse<RelatorioFinalMonitorContent>(
        relatorio.conteudo,
        relatorioFinalMonitorContentSchema,
        'conteúdo do relatório do monitor'
      )

      return {
        id: relatorio.id,
        relatorioDisciplinaId: relatorio.relatorioDisciplinaId,
        conteudo,
        status: relatorio.status,
        alunoAssinouEm: relatorio.alunoAssinouEm,
        professorAssinouEm: relatorio.professorAssinouEm,
        projeto: {
          id: relatorio.inscricao.projeto.id,
          titulo: relatorio.inscricao.projeto.titulo,
          ano: relatorio.inscricao.projeto.ano,
          semestre: relatorio.inscricao.projeto.semestre,
          disciplinaNome: relatorio.inscricao.projeto.disciplinaNome,
          professorResponsavel: {
            nomeCompleto: relatorio.inscricao.projeto.professorResponsavel.nomeCompleto,
          },
        },
      }
    },

    /**
     * Signs a monitor report as student (counter-signature).
     * When both professor and student sign, report is marked as APPROVED.
     * @throws {NotFoundError} If student or report not found
     * @throws {ForbiddenError} If report does not belong to student
     * @throws {BusinessError} If professor hasn't signed or student already signed
     */
    async signRelatorioMonitorAsAluno(userId: number, relatorioId: number) {
      const aluno = await repo.findAlunoByUserId(userId)
      if (!aluno) {
        throw new NotFoundError('Aluno', userId)
      }

      const relatorio = await repo.findRelatorioMonitorById(relatorioId)
      if (!relatorio) {
        throw new NotFoundError('Relatório', relatorioId)
      }

      if (relatorio.inscricao.alunoId !== aluno.id) {
        throw new ForbiddenError('Este relatório não pertence a você')
      }

      if (!relatorio.professorAssinouEm) {
        throw new BusinessError('O professor precisa assinar primeiro', 'PROFESSOR_NOT_SIGNED')
      }

      if (relatorio.alunoAssinouEm) {
        throw new BusinessError('Você já assinou este relatório', 'ALREADY_SIGNED')
      }

      // When both sign, mark as APPROVED
      return repo.updateRelatorioMonitor(relatorioId, {
        status: 'APPROVED',
        alunoAssinouEm: new Date(),
      })
    },
  }
}

export type MonitorRelatorioService = ReturnType<typeof createMonitorRelatorioService>
