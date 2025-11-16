import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { ACCEPTED_VOLUNTARIO, SEMESTRE_1, SEMESTRE_2, VAGA_STATUS_ATIVO, type UserRole } from '@/types'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoQueryService' })

export function createProjetoQueryService(repo: ProjetoRepository) {
  return {
    async getProjetos(userId: number, userRole: UserRole) {
      let projetosRaw: Awaited<ReturnType<typeof repo.findByProfessorId | typeof repo.findAll>>

      if (isProfessor(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor) {
          return []
        }
        projetosRaw = await repo.findByProfessorId(professor.id)
      } else {
        projetosRaw = await repo.findAll()
      }

      const inscricoesCount = await repo.getInscricoesCount()
      const inscricoesMap = new Map<string, number>()
      inscricoesCount.forEach((item) => {
        const key = `${item.projetoId}_${item.tipoVagaPretendida}`
        inscricoesMap.set(key, Number(item.count))
      })

      const projetosComDisciplinas = await Promise.all(
        projetosRaw.map(async (projeto) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(projeto.id)

          const inscritosBolsista = inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0
          const inscritosVoluntario = inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0
          const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0
          const totalInscritos = inscritosBolsista + inscritosVoluntario + inscritosAny

          return {
            ...projeto,
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? undefined,
            disciplinas,
            totalInscritos,
            inscritosBolsista,
            inscritosVoluntario,
          }
        })
      )

      log.info('Projetos recuperados com sucesso')
      return projetosComDisciplinas
    },

    async getProjeto(id: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findByIdWithRelations(id)

      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }
      }

      const [disciplinas, professoresParticipantes, atividades] = await Promise.all([
        repo.findDisciplinasByProjetoId(projeto.id),
        repo.findProfessoresParticipantes(projeto.id),
        repo.findAtividadesByProjetoId(projeto.id),
      ])

      return {
        ...projeto,
        professorResponsavel: {
          id: projeto.professorResponsavel.id,
          nomeCompleto: projeto.professorResponsavel.nomeCompleto,
          nomeSocial: projeto.professorResponsavel.nomeSocial,
          genero: projeto.professorResponsavel.genero,
          cpf: projeto.professorResponsavel.cpf,
          matriculaSiape: projeto.professorResponsavel.matriculaSiape,
          regime: projeto.professorResponsavel.regime,
          telefone: projeto.professorResponsavel.telefone,
          telefoneInstitucional: projeto.professorResponsavel.telefoneInstitucional,
          emailInstitucional: projeto.professorResponsavel.emailInstitucional,
        },
        disciplinas,
        professoresParticipantes,
        atividades,
      }
    },

    async getAvailableProjects(userId: number, _userRole: UserRole) {
      const aluno = await repo.findAlunoByUserId(userId)
      if (!aluno) {
        throw new NotFoundError('Aluno', userId)
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemester = now.getMonth() < 6 ? SEMESTRE_1 : SEMESTRE_2

      const periodoAtivo = await repo.findActivePeriodo(currentYear, currentSemester, now)
      const projetos = await repo.findApprovedByPeriod(currentYear, currentSemester)

      const inscricoes = await repo.findInscricoesByAlunoId(aluno.id)
      const inscricoesMap = new Map(inscricoes.map((i) => [i.projetoId, i]))

      const inscricoesCountAll = await repo.getInscricoesCount()
      const inscricoesCountMap = new Map(inscricoesCountAll.map((i) => [i.projetoId, Number(i.count)]))

      const projetosComDisciplinas = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(projeto.id)
          const totalInscritos = inscricoesCountMap.get(projeto.id) || 0
          const inscricaoAberta = !!periodoAtivo
          const jaInscrito = inscricoesMap.has(projeto.id)

          return {
            id: projeto.id,
            titulo: projeto.titulo,
            descricao: projeto.descricao,
            departamentoNome: projeto.departamentoNome,
            professorResponsavelNome: projeto.professorResponsavelNome,
            ano: projeto.ano,
            semestre: projeto.semestre,
            cargaHorariaSemana: projeto.cargaHorariaSemana,
            publicoAlvo: projeto.publicoAlvo,
            disciplinas: disciplinas.map((d) => ({
              codigo: d.codigo,
              nome: d.nome,
              turma: d.turma,
            })),
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas || 0,
            voluntariosSolicitados: projeto.voluntariosSolicitados || 0,
            totalInscritos,
            inscricaoAberta,
            jaInscrito,
          }
        })
      )

      log.info('Projetos disponíveis recuperados com sucesso')
      return projetosComDisciplinas
    },

    async getVolunteers(userId: number, _userRole: UserRole) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const inscricoes = await repo.findAcceptedVolunteersByProfessorId(professor.id, ACCEPTED_VOLUNTARIO)

      const voluntarios = await Promise.all(
        inscricoes.map(async (inscricao) => {
          const disciplina = await repo.findDisciplinasByProjetoId(inscricao.projeto.id)
          return {
            id: inscricao.aluno.id,
            nomeCompleto: inscricao.aluno.nomeCompleto,
            email: inscricao.alunoUser.email,
            telefone: inscricao.aluno.telefone || undefined,
            disciplina: disciplina[0] || { codigo: '', nome: 'N/A' },
            projeto: inscricao.projeto,
            status: VAGA_STATUS_ATIVO,
            dataInicio: inscricao.createdAt,
          }
        })
      )

      log.info('Voluntários recuperados com sucesso')
      return voluntarios
    },
  }
}

export type ProjetoQueryService = ReturnType<typeof createProjetoQueryService>
