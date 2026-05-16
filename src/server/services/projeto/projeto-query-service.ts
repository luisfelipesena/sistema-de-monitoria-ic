import { isAdmin, isProfessor } from '@/server/lib/auth-helpers'
import { ForbiddenError, NotFoundError } from '@/server/lib/errors'
import { ACCEPTED_VOLUNTARIO, SEMESTRE_1, SEMESTRE_2, VAGA_STATUS_ATIVO, type UserRole } from '@/types'
import { logger } from '@/utils/logger'
import type { ProjetoFilters, ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoQueryService' })

export function createProjetoQueryService(repo: ProjetoRepository) {
  return {
    async getProjetos(userId: number, userRole: UserRole) {
      let projetosRaw: Awaited<ReturnType<typeof repo.findByProfessorId | typeof repo.findAll>>

      const professor = await repo.findProfessorByUserId(userId)

      if (isAdmin(userRole)) {
        projetosRaw = await repo.findAll(professor?.departamentoId ?? undefined)
      } else if (isProfessor(userRole)) {
        if (!professor) return []
        projetosRaw = await repo.findByProfessorId(professor.id)
      } else {
        return []
      }

      const [inscricoesCount, editais] = await Promise.all([repo.getInscricoesCount(), repo.findEditaisByPeriodos()])

      const inscricoesMap = new Map<string, number>()
      inscricoesCount.forEach((item) => {
        const key = `${item.projetoId}_${item.tipoVagaPretendida}`
        inscricoesMap.set(key, Number(item.count))
      })

      // Create map of ano_semestre -> edital info
      const editalMap = new Map<string, { numeroEdital: string; publicado: boolean }>()
      editais.forEach((edital) => {
        if (edital.periodoInscricao) {
          const key = `${edital.periodoInscricao.ano}_${edital.periodoInscricao.semestre}`
          editalMap.set(key, {
            numeroEdital: edital.periodoInscricao.numeroEditalPrograd || edital.numeroEdital,
            publicado: edital.publicado,
          })
        }
      })

      const projetosComDisciplinas = await Promise.all(
        projetosRaw.map(async (projeto) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(projeto.id)

          const inscritosBolsista = inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0
          const inscritosVoluntario = inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0
          const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0
          const totalInscritos = inscritosBolsista + inscritosVoluntario + inscritosAny

          // Get edital info for this project's semester
          const editalKey = `${projeto.ano}_${projeto.semestre}`
          const editalInfo = editalMap.get(editalKey)

          return {
            ...projeto,
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? undefined,
            disciplinas,
            totalInscritos,
            inscritosBolsista,
            inscritosVoluntario,
            editalNumero: editalInfo?.numeroEdital ?? null,
            editalPublicado: editalInfo?.publicado ?? false,
          }
        })
      )

      // Check which projects are covered by approved collective projects
      const allIds = projetosComDisciplinas.map((p) => p.id)
      const coveredByCollective = await repo.findProjectIdsCoveredByCollective(allIds)

      const result = projetosComDisciplinas.map((p) => ({
        ...p,
        coveredByCollective: coveredByCollective.has(p.id),
      }))

      log.info('Projetos recuperados com sucesso')
      return result
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

      const [disciplinas, atividades, periodo] = await Promise.all([
        repo.findDisciplinasByProjetoId(projeto.id),
        repo.findAtividadesByProjetoId(projeto.id),
        repo.findPeriodoByProjetoSemestre(projeto.ano, projeto.semestre),
      ])

      const editalNumero = periodo?.numeroEditalPrograd || periodo?.edital?.numeroEdital || null

      return {
        ...projeto,
        mensagemRevisao: projeto.mensagemRevisao,
        revisaoSolicitadaEm: projeto.revisaoSolicitadaEm,
        editalNumero,
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
        atividades,
      }
    },

    async getAvailableProjects(userId: number, _userRole: UserRole) {
      const professor = await repo.findProfessorByUserId(userId)
      const userDeptoId = professor?.departamentoId ?? undefined

      const aluno = await repo.findAlunoByUserId(userId)

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemester = now.getMonth() < 6 ? SEMESTRE_1 : SEMESTRE_2

      const periodoAtivo = await repo.findActivePeriodo(currentYear, currentSemester, now)

      const projetos = await repo.findApprovedByPeriod(currentYear, currentSemester, userDeptoId)

      const inscricoes = aluno ? await repo.findInscricoesByAlunoId(aluno.id) : []
      const inscricoesMap = new Map(inscricoes.map((i) => [i.projetoId, i]))

      const inscricoesCountAll = await repo.getInscricoesCount()
      const inscricoesCountMap = new Map(inscricoesCountAll.map((i) => [i.projetoId, Number(i.count)]))

      const projetosComDisciplinas = projetos.map((projeto) => {
        const totalInscritos = inscricoesCountMap.get(projeto.id) || 0
        const jaInscrito = inscricoesMap.has(projeto.id)

        return {
          id: projeto.id,
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          departamentoNome: projeto.departamento?.nome ?? 'N/A',
          departamentoSigla: projeto.departamento?.sigla ?? 'N/A',
          professorResponsavelNome: projeto.professorResponsavel?.nomeCompleto ?? 'N/A',
          ano: projeto.ano,
          semestre: projeto.semestre,
          cargaHorariaSemana: projeto.cargaHorariaSemana,
          publicoAlvo: projeto.publicoAlvo,
          voluntariosSolicitados: projeto.voluntariosSolicitados || 0,
          bolsasDisponibilizadas: projeto.bolsasDisponibilizadas || 0,
          disciplinas: projeto.disciplinas.map((pd) => ({
            codigo: pd.disciplina.codigo,
            nome: pd.disciplina.nome,
          })),
          totalInscritos,
          inscricaoAberta: !!periodoAtivo,
          jaInscrito,
        }
      })

      log.info({ deptoId: userDeptoId }, 'Projetos disponíveis recuperados com sucesso')
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

    /**
     * Get projects with server-side filtering and pagination (admin only)
     */
    async getProjetosFiltered(filters: ProjetoFilters, userId: number, _userRole: UserRole) {
      const professor = await repo.findProfessorByUserId(userId)

      const secureFilters: ProjetoFilters = {
        ano: filters.ano,
        semestre: filters.semestre,
        status: filters.status,
        disciplina: filters.disciplina,
        professorNome: filters.professorNome,
        departamento: filters.departamento,
        limit: filters.limit,
        offset: filters.offset,
        departamentoId: professor?.departamentoId ?? undefined,
      }

      const [projetos, total] = await Promise.all([
        repo.findAllFiltered(secureFilters),
        repo.countFiltered(secureFilters),
      ])

      const [inscricoesCount, editais] = await Promise.all([repo.getInscricoesCount(), repo.findEditaisByPeriodos()])

      const inscricoesMap = new Map<string, number>()
      inscricoesCount.forEach((item) => {
        const key = `${item.projetoId}_${item.tipoVagaPretendida}`
        inscricoesMap.set(key, Number(item.count))
      })

      const editalMap = new Map<string, { numeroEdital: string; publicado: boolean }>()
      editais.forEach((edital) => {
        if (edital.periodoInscricao) {
          const key = `${edital.periodoInscricao.ano}_${edital.periodoInscricao.semestre}`
          editalMap.set(key, {
            numeroEdital: edital.periodoInscricao.numeroEditalPrograd || edital.numeroEdital,
            publicado: edital.publicado,
          })
        }
      })

      const projetosEnriquecidos = await Promise.all(
        projetos.map(async (projeto) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(projeto.id)

          const inscritosBolsista = inscricoesMap.get(`${projeto.id}_BOLSISTA`) || 0
          const inscritosVoluntario = inscricoesMap.get(`${projeto.id}_VOLUNTARIO`) || 0
          const inscritosAny = inscricoesMap.get(`${projeto.id}_ANY`) || 0
          const totalInscritos = inscritosBolsista + inscritosVoluntario + inscritosAny

          const editalKey = `${projeto.ano}_${projeto.semestre}`
          const editalInfo = editalMap.get(editalKey)

          return {
            ...projeto,
            bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? undefined,
            disciplinas,
            totalInscritos,
            inscritosBolsista,
            inscritosVoluntario,
            editalNumero: editalInfo?.numeroEdital ?? null,
            editalPublicado: editalInfo?.publicado ?? false,
          }
        })
      )

      projetosEnriquecidos.sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano
        if (a.semestre !== b.semestre) return b.semestre.localeCompare(a.semestre)
        return a.titulo.localeCompare(b.titulo)
      })

      log.info(
        { total, count: projetos.length, deptoId: professor?.departamentoId },
        'Projetos filtrados por departamento recuperados com sucesso'
      )

      return { projetos: projetosEnriquecidos, total }
    },
  }
}

export type ProjetoQueryService = ReturnType<typeof createProjetoQueryService>
