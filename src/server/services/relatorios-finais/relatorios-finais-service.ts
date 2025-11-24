import type { db } from '@/server/db'
import {
  type CreateRelatorioFinalDisciplinaInput,
  type CreateRelatorioFinalMonitorInput,
  type RelatorioFinalDisciplinaContent,
  type RelatorioFinalMonitorContent,
  type Semestre,
  type UpdateRelatorioFinalDisciplinaInput,
  type UpdateRelatorioFinalMonitorInput,
} from '@/types'
import { BusinessError, ForbiddenError, NotFoundError } from '@/types/errors'
import { createRelatoriosFinaisRepository } from './relatorios-finais-repository'

type Database = typeof db

// Safe JSON parse helper
function safeJsonParse<T>(json: string, errorContext: string): T {
  try {
    return JSON.parse(json) as T
  } catch {
    throw new BusinessError(`Dados inválidos: ${errorContext}`, 'INVALID_DATA')
  }
}

export function createRelatoriosFinaisService(database: Database) {
  const repo = createRelatoriosFinaisRepository(database)

  return {
    // ========================================
    // RELATORIO FINAL DISCIPLINA - PROFESSOR
    // ========================================

    async listRelatoriosDisciplinaForProfessor(userId: number, ano?: number, semestre?: Semestre) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      return repo.listRelatoriosDisciplinaByProfessor(professor.id, ano, semestre)
    },

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

      // Parse content
      const conteudo = safeJsonParse<RelatorioFinalDisciplinaContent>(
        relatorio.conteudo,
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
        'conteúdo do relatório da disciplina'
      )
      const updatedConteudo = { ...currentConteudo, ...input.conteudo }

      return repo.updateRelatorioDisciplina(input.id, {
        conteudo: JSON.stringify(updatedConteudo),
      })
    },

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

    // ========================================
    // RELATORIO FINAL MONITOR - PROFESSOR
    // ========================================

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
        'conteúdo do relatório do monitor'
      )
      const updatedConteudo = { ...currentConteudo, ...input.conteudo }

      return repo.updateRelatorioMonitor(input.id, {
        conteudo: JSON.stringify(updatedConteudo),
      })
    },

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
    // RELATORIO FINAL MONITOR - ALUNO
    // ========================================

    async listRelatoriosPendentesParaAluno(userId: number) {
      const aluno = await repo.findAlunoByUserId(userId)
      if (!aluno) {
        throw new NotFoundError('Aluno', userId)
      }

      const relatorios = await repo.listRelatoriosPendentesAssinaturaAluno(aluno.id)

      return relatorios.map((r) => {
        const conteudo = safeJsonParse<RelatorioFinalMonitorContent>(
          r.conteudo,
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

export type RelatoriosFinaisService = ReturnType<typeof createRelatoriosFinaisService>
