import type { db } from '@/server/db'
import {
  type CreateRelatorioFinalDisciplinaInput,
  type RelatorioFinalDisciplinaContent,
  relatorioFinalDisciplinaContentSchema,
  type Semestre,
  type UpdateRelatorioFinalDisciplinaInput,
} from '@/types'
import { BusinessError, ForbiddenError, NotFoundError } from '@/types/errors'
import { createRelatoriosFinaisRepository } from './relatorios-finais-repository'
import { safeJsonParse } from './utils'

type Database = typeof db

/**
 * Service for managing discipline final reports (professor operations).
 * Handles creation, updates, and signing of discipline reports.
 */
export function createDisciplinaRelatorioService(database: Database) {
  const repo = createRelatoriosFinaisRepository(database)

  return {
    /**
     * Lists all discipline reports for a professor filtered by year/semester.
     * @throws {NotFoundError} If professor not found
     */
    async listRelatoriosDisciplinaForProfessor(userId: number, ano?: number, semestre?: Semestre) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      return repo.listRelatoriosDisciplinaByProfessor(professor.id, ano, semestre)
    },

    /**
     * Gets detailed discipline report with monitors.
     * @throws {NotFoundError} If professor or project not found
     * @throws {ForbiddenError} If user is not the responsible professor
     */
    async getRelatorioDisciplina(userId: number, projetoId: number) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const projeto = await repo.findProjetoById(projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', projetoId)
      }

      if (projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      const relatorio = await repo.findRelatorioDisciplinaByProjetoId(projetoId)
      if (!relatorio) {
        // Return empty structure for creation
        const monitores = await repo.listMonitoresAceitosByProjetoId(projetoId)
        return {
          id: null,
          projetoId,
          conteudo: null,
          status: null,
          professorAssinouEm: null,
          projeto: {
            id: projeto.id,
            titulo: projeto.titulo,
            ano: projeto.ano,
            semestre: projeto.semestre,
            disciplinaNome: projeto.disciplinaNome,
            professorResponsavel: {
              id: professor.id,
              nomeCompleto: professor.nomeCompleto,
            },
          },
          monitores: monitores.map((v) => ({
            inscricaoId: v.inscricaoId,
            alunoId: v.alunoId,
            nomeCompleto: v.aluno.nomeCompleto,
            matricula: v.aluno.matricula,
            tipoVaga: v.tipo,
            relatorioId: null,
          })),
        }
      }

      // Parse and validate content
      const conteudo = safeJsonParse(
        relatorio.conteudo,
        relatorioFinalDisciplinaContentSchema,
        'conteúdo do relatório da disciplina'
      )

      // Get monitores with their relatorios
      const monitores = await repo.listMonitoresAceitosByProjetoId(projetoId)
      const relatoriosMonitores = await repo.listRelatoriosMonitorByRelatorioDisciplinaId(relatorio.id)

      const monitoresComRelatorio = monitores.map((v) => {
        const relatorioMonitor = relatoriosMonitores.find((r) => r.inscricaoId === v.inscricaoId)
        return {
          inscricaoId: v.inscricaoId,
          alunoId: v.alunoId,
          nomeCompleto: v.aluno.nomeCompleto,
          matricula: v.aluno.matricula,
          tipoVaga: v.tipo,
          relatorioId: relatorioMonitor?.id ?? null,
          relatorioStatus: relatorioMonitor?.status ?? null,
          alunoAssinouEm: relatorioMonitor?.alunoAssinouEm ?? null,
          professorAssinouEm: relatorioMonitor?.professorAssinouEm ?? null,
        }
      })

      return {
        id: relatorio.id,
        projetoId: relatorio.projetoId,
        conteudo,
        status: relatorio.status,
        professorAssinouEm: relatorio.professorAssinouEm,
        projeto: {
          id: projeto.id,
          titulo: projeto.titulo,
          ano: projeto.ano,
          semestre: projeto.semestre,
          disciplinaNome: projeto.disciplinaNome,
          professorResponsavel: {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
          },
        },
        monitores: monitoresComRelatorio,
      }
    },

    /**
     * Creates a new discipline report.
     * @throws {NotFoundError} If professor or project not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report already exists
     */
    async createRelatorioDisciplina(userId: number, input: CreateRelatorioFinalDisciplinaInput) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const projeto = await repo.findProjetoById(input.projetoId)
      if (!projeto) {
        throw new NotFoundError('Projeto', input.projetoId)
      }

      if (projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      // Check if relatorio already exists
      const existing = await repo.findRelatorioDisciplinaByProjetoId(input.projetoId)
      if (existing) {
        throw new BusinessError('Relatório já existe para este projeto', 'ALREADY_EXISTS')
      }

      const conteudoJson = JSON.stringify(input.conteudo)
      return repo.createRelatorioDisciplina({
        projetoId: input.projetoId,
        conteudo: conteudoJson,
        status: 'DRAFT',
      })
    },

    /**
     * Updates an existing discipline report.
     * @throws {NotFoundError} If professor or report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report is approved or already signed
     */
    async updateRelatorioDisciplina(userId: number, input: UpdateRelatorioFinalDisciplinaInput) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const relatorio = await repo.findRelatorioDisciplinaById(input.id)
      if (!relatorio) {
        throw new NotFoundError('Relatório', input.id)
      }

      if (relatorio.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      if (relatorio.status === 'APPROVED') {
        throw new BusinessError('Relatório já aprovado não pode ser editado', 'INVALID_STATUS')
      }

      // Block editing if report is already signed
      if (relatorio.professorAssinouEm) {
        throw new BusinessError('Relatório já assinado não pode ser editado', 'ALREADY_SIGNED')
      }

      const currentConteudo = safeJsonParse<RelatorioFinalDisciplinaContent>(
        relatorio.conteudo,
        relatorioFinalDisciplinaContentSchema,
        'conteúdo do relatório da disciplina'
      )
      const updatedConteudo = { ...currentConteudo, ...input.conteudo }

      return repo.updateRelatorioDisciplina(input.id, {
        conteudo: JSON.stringify(updatedConteudo),
      })
    },

    /**
     * Signs a discipline report as professor.
     * @throws {NotFoundError} If professor or report not found
     * @throws {ForbiddenError} If user is not the responsible professor
     * @throws {BusinessError} If report already signed
     */
    async signRelatorioDisciplina(userId: number, relatorioId: number) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const relatorio = await repo.findRelatorioDisciplinaById(relatorioId)
      if (!relatorio) {
        throw new NotFoundError('Relatório', relatorioId)
      }

      if (relatorio.projeto.professorResponsavelId !== professor.id) {
        throw new ForbiddenError('Você não é o professor responsável por este projeto')
      }

      if (relatorio.professorAssinouEm) {
        throw new BusinessError('Relatório já foi assinado', 'ALREADY_SIGNED')
      }

      return repo.updateRelatorioDisciplina(relatorioId, {
        status: 'SUBMITTED',
        professorAssinouEm: new Date(),
      })
    },
  }
}

export type DisciplinaRelatorioService = ReturnType<typeof createDisciplinaRelatorioService>
