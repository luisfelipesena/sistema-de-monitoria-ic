import { BusinessError } from '@/server/lib/errors'
import type { InscriptionFormData, UserRole } from '@/types'
import type { Database } from './inscricao-repository'
import { createInscricaoRepository } from './inscricao-repository'
import { createInscricaoPdfService } from './pdf/inscricao-pdf-service'
import { ProfessorInscricaoService } from './professor-inscricao-service'
import { StudentInscricaoService } from './student-inscricao-service'

export class InscricaoService {
  private studentService: StudentInscricaoService
  private professorService: ProfessorInscricaoService
  private pdfService: ReturnType<typeof createInscricaoPdfService>

  constructor(private db: Database) {
    const repository = createInscricaoRepository(db)
    this.studentService = new StudentInscricaoService(repository, db)
    this.professorService = new ProfessorInscricaoService(repository)
    this.pdfService = createInscricaoPdfService(db)
  }

  // Student methods
  async getMyStatus(userId: number, userRole: UserRole) {
    return this.studentService.getMyStatus(userId, userRole)
  }

  async getMyResults(userId: number, userRole: UserRole) {
    return this.studentService.getMyResults(userId, userRole)
  }

  async getMinhasInscricoes(userId: number) {
    return this.studentService.getMinhasInscricoes(userId)
  }

  async criarInscricao(userId: number, userRole: UserRole, input: InscriptionFormData) {
    const result = await this.studentService.createInscricao(userId, userRole, input)
    return {
      id: result.inscricaoId,
      message: 'Inscrição realizada com sucesso!',
      combinedPdfFileId: result.combinedPdfFileId,
    }
  }

  async regenerateDocumentos(userId: number, userRole: UserRole, inscricaoId: number) {
    return this.studentService.regenerateDocumentos(userId, userRole, inscricaoId)
  }

  async aceitarInscricao(userId: number, userRole: UserRole, inscricaoId: number) {
    return this.studentService.aceitarInscricao(userId, userRole, inscricaoId)
  }

  async recusarInscricao(userId: number, userRole: UserRole, inscricaoId: number, feedbackProfessor?: string) {
    return this.studentService.recusarInscricao(userId, userRole, inscricaoId, feedbackProfessor)
  }

  // PDF orchestration
  async getInscricaoDocumentos(userId: number, userRole: UserRole, inscricaoId: number) {
    // Autorização: aluno dono, professor responsável, ou admin
    const repo = createInscricaoRepository(this.db)
    const inscricao = await repo.findInscricaoWithProjetoProfessor(inscricaoId)
    if (!inscricao) throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')

    const isAdmin = userRole === 'admin'
    const aluno = await repo.findAlunoByUserId(userId)
    const professor = await repo.findProfessorByUserId(userId)
    const isOwnerStudent = aluno?.id === inscricao.alunoId
    const isProjectProfessor = professor?.id === inscricao.projeto.professorResponsavelId

    if (!isAdmin && !isOwnerStudent && !isProjectProfessor) {
      throw new BusinessError('Acesso negado aos documentos desta inscrição', 'FORBIDDEN')
    }

    return this.pdfService.getInscricaoDocumentos(inscricaoId)
  }

  // Professor methods
  async avaliarCandidato(
    userId: number,
    userRole: UserRole,
    input: {
      inscricaoId: number
      notaDisciplina: number
      notaSelecao: number
    }
  ) {
    return this.professorService.avaliarCandidato(userId, userRole, input)
  }

  async getInscricoesProjeto(userId: number, userRole: UserRole, projetoId: number) {
    return this.professorService.getInscricoesProjeto(userId, userRole, projetoId)
  }

  async evaluateApplications(
    userId: number,
    userRole: UserRole,
    input: {
      inscricaoId: number
      notaDisciplina: number
      notaSelecao: number
      coeficienteRendimento: number
      feedbackProfessor?: string
    }
  ) {
    return this.professorService.evaluateApplications(userId, userRole, input)
  }

  async acceptPosition(userId: number, userRole: UserRole, inscricaoId: number) {
    return this.professorService.acceptPosition(userId, userRole, inscricaoId)
  }

  async rejectPosition(userId: number, userRole: UserRole, inscricaoId: number, motivo?: string) {
    return this.professorService.rejectPosition(userId, userRole, inscricaoId, motivo)
  }

  async generateCommitmentTermData(userId: number, userRole: UserRole, inscricaoId: number) {
    return this.professorService.generateCommitmentTermData(userId, userRole, inscricaoId)
  }
}

export const createInscricaoService = (db: Database) => new InscricaoService(db)
