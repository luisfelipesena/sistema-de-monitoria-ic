import { BusinessError } from '@/server/lib/errors'
import type { StatusInscricao, TipoInscricao, TipoVaga, UserRole } from '@/types'
import {
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  BOLSISTA,
  CANDIDATE_RESULT_APROVADO,
  CANDIDATE_RESULT_EM_ANALISE,
  CANDIDATE_RESULT_REPROVADO,
  type CandidateResultStatus,
  PROJETO_STATUS_APPROVED,
  REJECTED_BY_PROFESSOR,
  REJECTED_BY_STUDENT,
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  SEMESTRE_1,
  STATUS_INSCRICAO_SUBMITTED,
  STUDENT,
  SUBMITTED,
  TIPO_INSCRICAO_BOLSISTA,
  TIPO_INSCRICAO_VOLUNTARIO,
  VAGA_STATUS_ATIVO,
  VOLUNTARIO,
} from '@/types'
import { logger } from '@/utils/logger'
import type { InscricaoRepository } from './inscricao-repository'

const log = logger.child({ context: 'StudentInscricaoService' })

const APPROVAL_STATUSES = new Set<StatusInscricao>([
  SELECTED_BOLSISTA,
  SELECTED_VOLUNTARIO,
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
])
const ACTIVE_MONITOR_STATUSES = new Set<StatusInscricao>([ACCEPTED_BOLSISTA, ACCEPTED_VOLUNTARIO])

export class StudentInscricaoService {
  constructor(private repository: InscricaoRepository) {}

  async getMyStatus(userId: number, userRole: UserRole) {
    if (userRole !== STUDENT) {
      throw new BusinessError('Acesso permitido apenas para estudantes', 'FORBIDDEN')
    }

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de estudante não encontrado', 'NOT_FOUND')
    }

    const inscricoes = await this.repository.findInscricoesByAlunoId(aluno.id)

    const totalInscricoes = inscricoes.length
    const totalAprovacoes = inscricoes.filter((inscricao) =>
      APPROVAL_STATUSES.has(inscricao.status as StatusInscricao)
    ).length

    const monitoriaAtiva = inscricoes.find((inscricao) =>
      ACTIVE_MONITOR_STATUSES.has(inscricao.status as StatusInscricao)
    )

    let monitoriaAtivaFormatted = null
    if (monitoriaAtiva) {
      monitoriaAtivaFormatted = {
        id: monitoriaAtiva.id,
        projeto: {
          titulo: monitoriaAtiva.projeto.titulo,
          disciplinas: monitoriaAtiva.projeto.disciplinas.map((pd) => ({
            codigo: pd.disciplina.codigo,
            nome: pd.disciplina.nome,
            turma: pd.disciplina.turma,
          })),
          professorResponsavelNome: monitoriaAtiva.projeto.professorResponsavel.nomeCompleto,
        },
        status: VAGA_STATUS_ATIVO,
        tipo: monitoriaAtiva.tipoVagaPretendida === BOLSISTA ? BOLSISTA : VOLUNTARIO,
        dataInicio:
          monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
            ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === SEMESTRE_1 ? 2 : 7, 1)
            : null,
        dataFim:
          monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
            ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === SEMESTRE_1 ? 6 : 11, 30)
            : null,
        cargaHorariaCumprida: 0,
        cargaHorariaPlanejada: monitoriaAtiva.projeto.cargaHorariaSemana * monitoriaAtiva.projeto.numeroSemanas,
      }
    }

    const historicoAtividades = inscricoes
      .filter((inscricao) => inscricao.status !== SUBMITTED)
      .map((inscricao) => {
        const status = inscricao.status as StatusInscricao
        const isAprovacao = APPROVAL_STATUSES.has(status)

        return {
          tipo: isAprovacao ? 'APROVACAO' : 'INSCRICAO',
          descricao: `${isAprovacao ? 'Aprovado em' : 'Inscrito em'} ${inscricao.projeto.titulo}`,
          data: inscricao.updatedAt || inscricao.createdAt,
        }
      })

    const proximasAcoes = []
    if (monitoriaAtiva) {
      const prazoRelatorio =
        monitoriaAtiva.projeto.ano && monitoriaAtiva.projeto.semestre
          ? new Date(monitoriaAtiva.projeto.ano, monitoriaAtiva.projeto.semestre === SEMESTRE_1 ? 6 : 11, 15)
          : undefined

      proximasAcoes.push({
        titulo: 'Relatório Final',
        descricao: 'Entregue o relatório final da monitoria',
        prazo: prazoRelatorio,
      })
    }

    return {
      totalInscricoes,
      totalAprovacoes,
      monitoriaAtiva: monitoriaAtivaFormatted,
      historicoAtividades,
      proximasAcoes,
    }
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
    if (userRole !== STUDENT) {
      throw new BusinessError('Acesso permitido apenas para estudantes', 'FORBIDDEN')
    }

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de estudante não encontrado', 'NOT_FOUND')
    }

    const projeto = await this.repository.findProjetoById(input.projetoId)
    if (!projeto || projeto.status !== PROJETO_STATUS_APPROVED) {
      throw new BusinessError('Projeto não encontrado ou não aprovado', 'NOT_FOUND')
    }

    const periodoAtivo = await this.repository.findActivePeriodoInscricao(projeto.ano, projeto.semestre)
    if (!periodoAtivo) {
      throw new BusinessError('Período de inscrições não está ativo', 'BAD_REQUEST')
    }

    const existingInscricao = await this.repository.findInscricaoByAlunoAndProjeto(
      aluno.id,
      input.projetoId,
      periodoAtivo.id
    )
    if (existingInscricao) {
      throw new BusinessError('Você já se inscreveu neste projeto', 'CONFLICT')
    }

    if (!input.tipo) {
      throw new BusinessError('Tipo de vaga é obrigatório', 'BAD_REQUEST')
    }

    if (input.tipo === BOLSISTA && (!projeto.bolsasDisponibilizadas || projeto.bolsasDisponibilizadas <= 0)) {
      throw new BusinessError('Não há vagas de bolsista disponíveis para este projeto', 'BAD_REQUEST')
    }

    if (input.tipo === VOLUNTARIO && (!projeto.voluntariosSolicitados || projeto.voluntariosSolicitados <= 0)) {
      throw new BusinessError('Não há vagas de voluntário disponíveis para este projeto', 'BAD_REQUEST')
    }

    const projetoDisciplinas = await this.repository.findProjetoDisciplinas(input.projetoId)

    let notaDisciplina: number | null = null
    for (const pd of projetoDisciplinas) {
      const grade = await this.repository.findStudentGradeWithEquivalents(aluno.id, pd.disciplina.id)
      if (grade !== null) {
        notaDisciplina = grade
        log.info({ alunoId: aluno.id, disciplinaId: pd.disciplina.id, nota: grade }, 'Found student grade')
        break
      }
    }

    const novaInscricao = await this.repository.createInscricao({
      periodoInscricaoId: periodoAtivo.id,
      projetoId: input.projetoId,
      alunoId: aluno.id,
      tipoVagaPretendida: input.tipo,
      status: STATUS_INSCRICAO_SUBMITTED,
      coeficienteRendimento: aluno.cr?.toString() || null,
      notaDisciplina: notaDisciplina?.toString() || null,
    })

    if (input.documentos && input.documentos.length > 0) {
      await this.repository.createDocumentos(novaInscricao.id, input.documentos)
    }

    log.info({ inscricaoId: novaInscricao.id }, 'Nova inscrição criada')

    return {
      success: true,
      inscricaoId: novaInscricao.id,
    }
  }

  async getMyResults(userId: number, userRole: string) {
    if (userRole !== STUDENT) {
      throw new BusinessError('Acesso permitido apenas para estudantes', 'FORBIDDEN')
    }

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de estudante não encontrado', 'NOT_FOUND')
    }

    const inscricoes = await this.repository.findInscricoesByAlunoId(aluno.id)

    return inscricoes.map((inscricao) => {
      let status: CandidateResultStatus
      switch (inscricao.status) {
        case SELECTED_BOLSISTA:
        case SELECTED_VOLUNTARIO:
        case ACCEPTED_BOLSISTA:
        case ACCEPTED_VOLUNTARIO:
          status = CANDIDATE_RESULT_APROVADO
          break
        case REJECTED_BY_PROFESSOR:
          status = CANDIDATE_RESULT_REPROVADO
          break
        case STATUS_INSCRICAO_SUBMITTED:
          status = CANDIDATE_RESULT_EM_ANALISE
          break
        default:
          status = CANDIDATE_RESULT_EM_ANALISE
      }

      return {
        id: inscricao.id,
        projeto: {
          id: inscricao.projeto.id,
          titulo: inscricao.projeto.titulo,
          disciplinas: inscricao.projeto.disciplinas.map((pd) => ({
            codigo: pd.disciplina.codigo,
            nome: pd.disciplina.nome,
            turma: pd.disciplina.turma,
          })),
          professorResponsavelNome: inscricao.projeto.professorResponsavel.nomeCompleto,
        },
        tipoInscricao: (inscricao.tipoVagaPretendida === TIPO_INSCRICAO_BOLSISTA
          ? TIPO_INSCRICAO_BOLSISTA
          : TIPO_INSCRICAO_VOLUNTARIO) as TipoVaga,
        status,
        dataResultado: inscricao.updatedAt || undefined,
        posicaoLista: undefined,
        observacoes: inscricao.feedbackProfessor || undefined,
      }
    })
  }

  async getMinhasInscricoes(userId: number) {
    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de aluno não encontrado', 'NOT_FOUND')
    }

    const inscricoes = await this.repository.findInscricoesWithDetails(aluno.id)

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

    log.info({ alunoId: aluno.id }, 'Inscrições recuperadas')
    return inscricoesComDisciplinas
  }

  async aceitarInscricao(userId: number, userRole: string, inscricaoId: number) {
    if (userRole !== STUDENT) {
      throw new BusinessError('Apenas estudantes podem aceitar inscrições', 'FORBIDDEN')
    }

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de aluno não encontrado', 'NOT_FOUND')
    }

    const inscricao = await this.repository.findInscricaoByIdAndAlunoId(inscricaoId, aluno.id)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (inscricao.status !== SELECTED_BOLSISTA && inscricao.status !== SELECTED_VOLUNTARIO) {
      throw new BusinessError('Inscrição não está selecionada', 'BAD_REQUEST')
    }

    if (inscricao.status === SELECTED_BOLSISTA) {
      const bolsaExistente = await this.repository.findAcceptedBolsaBySemester(aluno.id, ACCEPTED_BOLSISTA)

      if (
        bolsaExistente &&
        bolsaExistente.projeto.ano === inscricao.projeto.ano &&
        bolsaExistente.projeto.semestre === inscricao.projeto.semestre
      ) {
        throw new BusinessError('Você já possui uma bolsa aceita neste semestre', 'BAD_REQUEST')
      }
    }

    const novoStatus = inscricao.status === SELECTED_BOLSISTA ? ACCEPTED_BOLSISTA : ACCEPTED_VOLUNTARIO

    await this.repository.updateInscricao(inscricaoId, {
      status: novoStatus,
      updatedAt: new Date(),
    })

    log.info({ inscricaoId, novoStatus }, 'Inscrição aceita')

    return {
      success: true,
      message: 'Inscrição aceita com sucesso!',
    }
  }

  async recusarInscricao(userId: number, userRole: string, inscricaoId: number, feedbackProfessor?: string) {
    if (userRole !== STUDENT) {
      throw new BusinessError('Apenas estudantes podem recusar inscrições', 'FORBIDDEN')
    }

    const aluno = await this.repository.findAlunoByUserId(userId)
    if (!aluno) {
      throw new BusinessError('Perfil de aluno não encontrado', 'NOT_FOUND')
    }

    const inscricao = await this.repository.findInscricaoByIdAndAlunoId(inscricaoId, aluno.id)
    if (!inscricao) {
      throw new BusinessError('Inscrição não encontrada', 'NOT_FOUND')
    }

    if (inscricao.status !== SELECTED_BOLSISTA && inscricao.status !== SELECTED_VOLUNTARIO) {
      throw new BusinessError('Inscrição não está selecionada', 'BAD_REQUEST')
    }

    await this.repository.updateInscricao(inscricaoId, {
      status: REJECTED_BY_STUDENT,
      feedbackProfessor,
      updatedAt: new Date(),
    })

    log.info({ inscricaoId }, 'Inscrição recusada')

    return {
      success: true,
      message: 'Inscrição recusada com sucesso!',
    }
  }
}
