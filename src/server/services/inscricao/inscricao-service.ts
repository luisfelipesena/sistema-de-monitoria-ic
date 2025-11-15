import type { TipoInscricao, UserRole } from '@/types'
import type { Database } from './inscricao-repository'
import { createInscricaoRepository } from './inscricao-repository'
import { StudentInscricaoService } from './student-inscricao-service'
import { ProfessorInscricaoService } from './professor-inscricao-service'
import { BusinessError } from '@/server/lib/errors'

export class InscricaoService {
  private studentService: StudentInscricaoService
  private professorService: ProfessorInscricaoService

  constructor(db: Database) {
    const repository = createInscricaoRepository(db)
    this.studentService = new StudentInscricaoService(repository)
    this.professorService = new ProfessorInscricaoService(repository)
  }

  // Student methods
  async getMyStatus(userId: number, userRole: UserRole) {
    return this.studentService.getMyStatus(userId, userRole)
  }

  async createInscricao(
    userId: number,
    userRole: UserRole,
    input: {
      projetoId: number
      tipo: TipoInscricao
      motivacao: string
      documentos?: Array<{ fileId: string; tipoDocumento: string }>
    }
  ) {
    return this.studentService.createInscricao(userId, userRole, input)
  }

  async getMyResults(userId: number, userRole: UserRole) {
    return this.studentService.getMyResults(userId, userRole)
  }

  async getMinhasInscricoes(userId: number) {
    return this.studentService.getMinhasInscricoes(userId)
  }

  async criarInscricao(
    userId: number,
    userRole: UserRole,
    input: {
      projetoId: number
      tipoVagaPretendida?: TipoInscricao
      documentos?: Array<{ fileId: string; tipoDocumento: string }>
    }
  ) {
    if (!input.tipoVagaPretendida) {
      throw new BusinessError('Tipo de vaga é obrigatório', 'BAD_REQUEST')
    }
    const result = await this.studentService.createInscricao(userId, userRole, {
      projetoId: input.projetoId,
      tipo: input.tipoVagaPretendida,
      motivacao: '',
      documentos: input.documentos,
    })
    return {
      id: result.inscricaoId,
      message: 'Inscrição realizada com sucesso!',
    }
  }

  async aceitarInscricao(userId: number, userRole: UserRole, inscricaoId: number) {
    return this.studentService.aceitarInscricao(userId, userRole, inscricaoId)
  }

  async recusarInscricao(userId: number, userRole: UserRole, inscricaoId: number, feedbackProfessor?: string) {
    return this.studentService.recusarInscricao(userId, userRole, inscricaoId, feedbackProfessor)
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
