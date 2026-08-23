import { isProfessor, requireAdminOrProfessor, requireProfessor, requireStudent } from '@/server/lib/auth-helpers'
import { emailSender } from '@/server/lib/email/email-sender'
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
      notaFinal: (Math.round(notaFinal * 10) / 10).toFixed(1),
      updatedAt: new Date(),
    })

    log.info({ inscricaoId: input.inscricaoId, notaFinal }, 'Candidato avaliado')

    return {
      success: true,
      notaFinal: Math.round(notaFinal * 10) / 10,
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
        const [disciplinas, documentos] = await Promise.all([
          this.repository.findDisciplinasByProjetoId(inscricao.projetoId),
          this.repository.findDocumentosByInscricaoId(inscricao.id),
        ])

        const historicoDoc = documentos.find((d) => d.tipoDocumento === 'HISTORICO_ESCOLAR')
        const historicoEscolarFileId = historicoDoc?.fileId ?? inscricao.aluno.historicoEscolarFileId ?? null

        return {
          ...inscricao,
          notaDisciplina: inscricao.notaDisciplina ? Number(inscricao.notaDisciplina) : null,
          notaSelecao: inscricao.notaSelecao ? Number(inscricao.notaSelecao) : null,
          coeficienteRendimento: inscricao.coeficienteRendimento ? Number(inscricao.coeficienteRendimento) : null,
          notaFinal: inscricao.notaFinal ? Number(inscricao.notaFinal) : null,
          documentos,
          historicoEscolarFileId,
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

    const notaFinalRaw = (input.notaDisciplina * 5 + input.notaSelecao * 3 + input.coeficienteRendimento * 2) / 10
    const notaFinal = (Math.round(notaFinalRaw * 10) / 10).toFixed(1)

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
      notaFinal,
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

    const isBolsista = inscricao.status === SELECTED_BOLSISTA
    const tipoVaga: 'BOLSISTA' | 'VOLUNTARIO' = isBolsista ? 'BOLSISTA' : 'VOLUNTARIO'

    await this.repository.updateInscricao(inscricaoId, {
      status: REJECTED_BY_STUDENT,
      feedbackProfessor: motivo || 'Vaga recusada pelo estudante',
      updatedAt: new Date(),
    })

    const tipoVagaLabel = isBolsista ? 'bolsista' : 'voluntária'
    log.info({ inscricaoId, motivo }, `Vaga ${tipoVagaLabel} recusada`)

    // Promote next candidate from waitlist automatically
    const promotedCandidate = await this.promoteNextCandidateFromWaitlist(inscricao.projetoId, tipoVaga, userId)

    const promotionMessage = promotedCandidate
      ? ` Próximo candidato da lista de espera (${promotedCandidate.aluno.nomeCompleto}) foi convocado automaticamente.`
      : ''

    return {
      success: true,
      message: `Vaga ${tipoVagaLabel} recusada com sucesso.${promotionMessage}`,
    }
  }

  async promoteNextCandidateFromWaitlist(
    projetoId: number,
    tipoVaga: 'BOLSISTA' | 'VOLUNTARIO',
    remetenteUserId?: number
  ) {
    const candidate = await this.repository.findNextWaitlistCandidate(projetoId, tipoVaga)
    if (!candidate) {
      log.info({ projetoId, tipoVaga }, 'Nenhum candidato elegível na lista de espera para convocação automática')
      return null
    }

    const newStatus: StatusInscricao = tipoVaga === 'BOLSISTA' ? SELECTED_BOLSISTA : SELECTED_VOLUNTARIO

    await this.repository.updateInscricao(candidate.id, {
      status: newStatus,
      updatedAt: new Date(),
    })

    log.info(
      { candidateId: candidate.id, alunoId: candidate.alunoId, newStatus },
      'Candidato promovido da lista de espera com sucesso'
    )

    try {
      const tipoVagaLabel = tipoVaga === 'BOLSISTA' ? 'Bolsista' : 'Voluntário(a)'
      await emailSender.send({
        to: candidate.aluno.user.email,
        subject: `🎓 Convocação da Lista de Espera - Monitoria ${candidate.projeto.titulo}`,
        html: `
Olá ${candidate.aluno.nomeCompleto},<br><br>

Você foi <strong>convocado(a) da lista de espera</strong> para a vaga de monitoria <strong>${tipoVagaLabel}</strong> no projeto "<strong>${candidate.projeto.titulo}</strong>"!<br><br>

<strong>Nota Final:</strong> ${candidate.notaFinal}<br>
<strong>Professor Responsável:</strong> ${candidate.projeto.professorResponsavel.nomeCompleto}<br><br>

Por favor, acesse o portal do Sistema de Monitoria IC para <strong>Aceitar</strong> ou <strong>Recusar</strong> sua vaga.<br><br>

Atenciosamente,<br>
Sistema de Monitoria IC
        `,
        tipoNotificacao: 'CONVOCACAO_LISTA_ESPERA',
        remetenteUserId,
        projetoId,
        alunoId: candidate.alunoId,
      })
    } catch (emailErr) {
      log.error({ emailErr, candidateId: candidate.id }, 'Erro ao enviar e-mail de convocação da lista de espera')
    }

    return candidate
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

    const monitorAssinatura = inscricao.assinaturaAlunoFileId || null
    let professorAssinatura: string | null = null

    try {
      const profUserId = inscricao.projeto.professorResponsavel?.userId

      const profSig = await this.repository.db.query.assinaturaDocumentoTable.findFirst({
        where: (sigs, { and, eq, or, inArray }) =>
          and(
            or(eq(sigs.projetoId, inscricao.projetoId), profUserId ? eq(sigs.userId, profUserId) : undefined),
            inArray(sigs.tipoAssinatura, ['ATA_SELECAO_PROFESSOR', 'PROJETO_PROFESSOR_RESPONSAVEL'])
          ),
      })
      if (profSig) {
        professorAssinatura = profSig.assinaturaData
      }
    } catch (err) {
      log.error({ err }, 'Erro ao buscar assinatura do professor')
    }

    const endereco = inscricao.aluno.endereco
    const enderecoCompleto = endereco
      ? [
          endereco.rua,
          endereco.numero ? String(endereco.numero) : '',
          endereco.bairro,
          endereco.cidade,
          endereco.estado,
          endereco.cep ? `CEP: ${endereco.cep}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : ''

    return {
      monitor: {
        nome: inscricao.aluno.nomeCompleto,
        matricula: inscricao.aluno.matricula,
        email: inscricao.aluno.user.email,
        rg: inscricao.aluno.rg,
        cpf: inscricao.aluno.cpf,
        cursoNome: inscricao.aluno.cursoNome,
        banco: inscricao.aluno.banco,
        agencia: inscricao.aluno.agencia,
        conta: inscricao.aluno.conta,
        digitoConta: inscricao.aluno.digitoConta,
        enderecoCompleto,
        ...(inscricao.aluno.telefone && { telefone: inscricao.aluno.telefone }),
        cr: inscricao.aluno.cr,
        assinaturaBase64: monitorAssinatura,
      },
      professor: {
        nome: inscricao.projeto.professorResponsavel.nomeCompleto,
        ...(inscricao.projeto.professorResponsavel.matriculaSiape && {
          matriculaSiape: inscricao.projeto.professorResponsavel.matriculaSiape,
        }),
        email: inscricao.projeto.professorResponsavel.emailInstitucional,
        departamento: inscricao.projeto.departamento?.nome || 'N/A',
        assinaturaBase64: professorAssinatura,
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
