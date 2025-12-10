import { isProfessor, requireAdminOrProfessor, requireProfessor, requireStudent } from '@/server/lib/auth-helpers'
import { BusinessError } from '@/server/lib/errors'
import type { StatusInscricao, UserRole } from '@/types'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  REJECTED_BY_STUDENT,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  SEMESTRE_1,
  SUBMITTED,
  TIPO_VAGA_BOLSISTA,
  TIPO_VAGA_VOLUNTARIO,
  type TipoVaga,
} from '@/types'
import { logger } from '@/utils/logger'
import type { InscricaoRepository } from './inscricao-repository'

const log = logger.child({ context: 'ProfessorInscricaoService' })

const SELECTED_STATUSES = new Set<StatusInscricao>([SELECTED_BOLSISTA, SELECTED_VOLUNTARIO])
const ACCEPTED_STATUSES = new Set<StatusInscricao>([ACCEPTED_BOLSISTA, ACCEPTED_VOLUNTARIO])

export class ProfessorInscricaoService {
  constructor(private repository: InscricaoRepository) {}

  async avaliarCandidato(
    userId: number,
    userRole: UserRole,
    input: {
      inscricaoId: number
      notaDisciplina: number
      notaSelecao: number
    }
  ) {
    requireProfessor(userRole)

    const professor = await this.repository.findProfessorByUserId(userId)
    if (!professor) {
      throw new BusinessError('Perfil de professor não encontrado', 'NOT_FOUND')
    }

    const inscricao = await this.repository.findInscricaoById(input.inscricaoId)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (inscricao.projeto.professorResponsavelId !== professor.id) {
      throw new BusinessError('Você não pode avaliar candidatos de outros projetos', 'FORBIDDEN')
    }

    if (inscricao.status !== SUBMITTED) {
      throw new BusinessError('Esta inscrição não pode ser avaliada', 'BAD_REQUEST')
    }

    const coeficiente = Number(inscricao.coeficienteRendimento) || 0
    const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + coeficiente * 2) / 10

    await this.repository.updateInscricao(input.inscricaoId, {
      notaDisciplina: input.notaDisciplina.toString(),
      notaSelecao: input.notaSelecao.toString(),
      notaFinal: (Math.round(notaFinal * 100) / 100).toString(),
      updatedAt: new Date(),
    })

    log.info({ inscricaoId: input.inscricaoId, notaFinal }, 'Candidato avaliado')

    return {
      success: true,
      notaFinal: Math.round(notaFinal * 100) / 100,
    }
  }

  async getInscricoesProjeto(userId: number, userRole: UserRole, projetoId: number) {
    const projeto = await this.repository.findProjetoById(projetoId)
    if (!projeto) {
      throw new BusinessError('Projeto não encontrado', 'NOT_FOUND')
    }

    requireAdminOrProfessor(userRole)

    if (isProfessor(userRole)) {
      const professor = await this.repository.findProfessorByUserId(userId)
      if (!professor || projeto.professorResponsavelId !== professor.id) {
        throw new BusinessError('Acesso negado a este projeto', 'FORBIDDEN')
      }
    }

    const inscricoes = await this.repository.findInscricoesByProjetoId(projetoId)

    const inscricoesComDisciplinas = await Promise.all(
      inscricoes.map(async (inscricao) => {
        const disciplinas = await this.repository.findDisciplinasByProjetoId(inscricao.projetoId)

        return {
          ...inscricao,
          notaDisciplina: inscricao.notaDisciplina ? Number(inscricao.notaDisciplina) : null,
          notaSelecao: inscricao.notaSelecao ? Number(inscricao.notaSelecao) : null,
          coeficienteRendimento: inscricao.coeficienteRendimento ? Number(inscricao.coeficienteRendimento) : null,
          notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : null,
          projeto: {
            ...inscricao.projeto,
            professorResponsavel: inscricao.professorResponsavel,
            departamento: inscricao.departamento,
            disciplinas,
          },
          aluno: {
            ...inscricao.aluno,
            user: inscricao.alunoUser,
          },
        }
      })
    )

    log.info({ projetoId }, 'Inscrições do projeto recuperadas')
    return inscricoesComDisciplinas
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
    requireProfessor(userRole)

    const notaFinal = (input.notaDisciplina * 5 + input.notaSelecao * 3 + input.coeficienteRendimento * 2) / 10

    const inscricao = await this.repository.findInscricaoWithProjetoProfessor(input.inscricaoId)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (inscricao.projeto.professorResponsavel.userId !== userId) {
      throw new BusinessError('Você não é responsável por este projeto', 'FORBIDDEN')
    }

    await this.repository.updateInscricao(input.inscricaoId, {
      notaDisciplina: input.notaDisciplina.toString(),
      notaSelecao: input.notaSelecao.toString(),
      coeficienteRendimento: input.coeficienteRendimento.toString(),
      notaFinal: notaFinal.toString(),
      feedbackProfessor: input.feedbackProfessor,
      updatedAt: new Date(),
    })

    return inscricao
  }

  async acceptPosition(userId: number, userRole: UserRole, inscricaoId: number) {
    requireStudent(userRole)

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de estudante não encontrado', 'NOT_FOUND')
    }

    const inscricao = await this.repository.findInscricaoByIdAndAlunoId(inscricaoId, aluno.id)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (!SELECTED_STATUSES.has(inscricao.status as StatusInscricao)) {
      throw new BusinessError('Não é possível aceitar uma vaga não oferecida', 'BAD_REQUEST')
    }

    if (inscricao.status === SELECTED_BOLSISTA) {
      const bolsaExistente = await this.repository.findAcceptedBolsaBySemester(aluno.id, ACCEPTED_BOLSISTA)

      if (
        bolsaExistente &&
        bolsaExistente.projeto.ano === inscricao.projeto.ano &&
        bolsaExistente.projeto.semestre === inscricao.projeto.semestre
      ) {
        throw new BusinessError(
          'Você já possui uma bolsa neste semestre. Só é permitida uma bolsa por semestre.',
          'BAD_REQUEST'
        )
      }
    }

    const newStatus = inscricao.status === SELECTED_BOLSISTA ? ACCEPTED_BOLSISTA : ACCEPTED_VOLUNTARIO

    await this.repository.updateInscricao(inscricaoId, {
      status: newStatus,
      updatedAt: new Date(),
    })

    const tipoVaga = newStatus === ACCEPTED_BOLSISTA ? 'bolsista' : 'voluntária'
    log.info({ inscricaoId, newStatus }, `Vaga ${tipoVaga} aceita`)

    return {
      success: true,
      message: `Vaga ${tipoVaga} aceita com sucesso!`,
    }
  }

  async rejectPosition(userId: number, userRole: UserRole, inscricaoId: number, motivo?: string) {
    requireStudent(userRole)

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de estudante não encontrado', 'NOT_FOUND')
    }

    const inscricao = await this.repository.findInscricaoByIdAndAlunoId(inscricaoId, aluno.id)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (!SELECTED_STATUSES.has(inscricao.status as StatusInscricao)) {
      throw new BusinessError('Não é possível recusar uma vaga não oferecida', 'BAD_REQUEST')
    }

    await this.repository.updateInscricao(inscricaoId, {
      status: REJECTED_BY_STUDENT,
      feedbackProfessor: motivo || 'Vaga recusada pelo estudante',
      updatedAt: new Date(),
    })

    const tipoVaga = inscricao.status === SELECTED_BOLSISTA ? 'bolsista' : 'voluntária'
    log.info({ inscricaoId, motivo }, `Vaga ${tipoVaga} recusada`)

    return {
      success: true,
      message: `Vaga ${tipoVaga} recusada com sucesso.`,
    }
  }

  async generateCommitmentTermData(userId: number, userRole: UserRole, inscricaoId: number) {
    const inscricao = await this.repository.findInscricaoWithFullDetails(inscricaoId)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    // Allow student, professor, or admin to generate term data
    if (isProfessor(userRole)) {
      const professor = await this.repository.findProfessorByUserId(userId)
      if (!professor || inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new BusinessError('Acesso negado a esta inscrição', 'FORBIDDEN')
      }
    } else {
      // For students (and implicitly admins who can access anything)
      const aluno = await this.repository.findAlunoByUserId(userId)
      if (aluno && inscricao.alunoId !== aluno.id) {
        throw new BusinessError('Acesso negado a esta inscrição', 'FORBIDDEN')
      }
    }

    if (!ACCEPTED_STATUSES.has(inscricao.status as StatusInscricao)) {
      throw new BusinessError('Termo de compromisso só pode ser gerado para vagas aceitas', 'BAD_REQUEST')
    }

    const disciplinas = await this.repository.findDisciplinasByProjetoId(inscricao.projetoId)

    const hoje = new Date()
    const inicioSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === SEMESTRE_1 ? 2 : 7, 1)
    const fimSemestre = new Date(inscricao.projeto.ano, inscricao.projeto.semestre === SEMESTRE_1 ? 6 : 11, 30)

    const tipoMonitoria: TipoVaga = inscricao.status === ACCEPTED_BOLSISTA ? TIPO_VAGA_BOLSISTA : TIPO_VAGA_VOLUNTARIO
    const numeroTermo = `${inscricao.projeto.ano}${inscricao.projeto.semestre === SEMESTRE_1 ? '1' : '2'}-${inscricao.id.toString().padStart(4, '0')}`

    return {
      monitor: {
        nome: inscricao.aluno.nomeCompleto,
        matricula: inscricao.aluno.matricula,
        email: inscricao.aluno.user.email,
        ...(inscricao.aluno.telefone && { telefone: inscricao.aluno.telefone }),
        cr: inscricao.aluno.cr,
      },
      professor: {
        nome: inscricao.projeto.professorResponsavel.nomeCompleto,
        ...(inscricao.projeto.professorResponsavel.matriculaSiape && {
          matriculaSiape: inscricao.projeto.professorResponsavel.matriculaSiape,
        }),
        email: inscricao.projeto.professorResponsavel.emailInstitucional,
        departamento: inscricao.projeto.departamento?.nome || 'N/A',
      },
      projeto: {
        titulo: inscricao.projeto.titulo,
        disciplinas,
        ano: inscricao.projeto.ano,
        semestre: inscricao.projeto.semestre,
        cargaHorariaSemana: inscricao.projeto.cargaHorariaSemana,
        numeroSemanas: inscricao.projeto.numeroSemanas,
      },
      monitoria: {
        tipo: tipoMonitoria,
        dataInicio: inicioSemestre.toLocaleDateString('pt-BR'),
        dataFim: fimSemestre.toLocaleDateString('pt-BR'),
        valorBolsa:
          tipoMonitoria === TIPO_VAGA_BOLSISTA ? parseFloat(inscricao.periodoInscricao.edital.valorBolsa) : undefined,
      },
      termo: {
        numero: numeroTermo,
        dataGeracao: hoje.toLocaleDateString('pt-BR'),
      },
    }
  }
}
