import { isAdmin, isProfessor, requireAdminOrProfessor } from '@/server/lib/auth-helpers'
import { BusinessError, ForbiddenError, NotFoundError, ValidationError } from '@/server/lib/errors'
import {
  ACCEPTED_VOLUNTARIO,
  PROJETO_STATUS_DRAFT,
  type CreateProjetoInput,
  type UpdateProjetoInput,
  type UserRole,
} from '@/types'
import { logger } from '@/utils/logger'
import type { ProjetoRepository } from './projeto-repository'

const log = logger.child({ context: 'ProjetoCreationService' })

export function createProjetoCreationService(repo: ProjetoRepository) {
  return {
    async createProjeto(input: CreateProjetoInput) {
      requireAdminOrProfessor(input.userRole)

      let professorResponsavelId: number

      if (isProfessor(input.userRole) && !isAdmin(input.userRole)) {
        const professor = await repo.findProfessorByUserId(input.userId)
        if (!professor) {
          throw new NotFoundError('Professor', input.userId)
        }
        professorResponsavelId = professor.id
      } else {
        // Admin
        if (!input.professorResponsavelId) {
          throw new ValidationError('Admins devem especificar o professor responsável')
        }
        const professor = await repo.findProfessorById(input.professorResponsavelId)
        if (!professor) {
          throw new NotFoundError('Professor', input.professorResponsavelId)
        }
        professorResponsavelId = input.professorResponsavelId
      }

      // Use disciplinaIds or disciplinas
      const disciplinaIdsToUse = input.disciplinaIds || input.disciplinas

      // Validar apenas uma disciplina
      if (disciplinaIdsToUse && disciplinaIdsToUse.length > 1) {
        throw new ValidationError('Um projeto pode ter apenas uma disciplina vinculada, conforme edital')
      }

      // Verificar duplicação de disciplina-turma no período
      if (disciplinaIdsToUse && disciplinaIdsToUse.length > 0) {
        const disciplinaId = disciplinaIdsToUse[0]
        const disciplina = await repo.findDisciplinaById(disciplinaId)

        if (!disciplina) {
          throw new NotFoundError('Disciplina', disciplinaId)
        }

        const projetoExistente = await repo.findExistingByDisciplinaPeriod(input.ano, input.semestre)

        if (projetoExistente) {
          const disciplinaConflito = projetoExistente.disciplinas.find(
            (pd) => pd.disciplina.codigo === disciplina.codigo && pd.disciplina.turma === disciplina.turma
          )

          if (disciplinaConflito) {
            throw new BusinessError(
              `Já existe um projeto para a disciplina ${disciplina.codigo} (${disciplina.turma}) no período ${input.ano}.${input.semestre}`,
              'CONFLICT'
            )
          }
        }
      }

      // Transaction: criar projeto + disciplinas + atividades + auto-associação
      const novoProjeto = await repo.insert({
        titulo: input.titulo,
        descricao: input.descricao,
        departamentoId: input.departamentoId,
        professorResponsavelId,
        ano: input.ano,
        semestre: input.semestre,
        tipoProposicao: input.tipoProposicao,
        bolsasSolicitadas: input.bolsasSolicitadas || 0,
        voluntariosSolicitados: input.voluntariosSolicitados || 0,
        cargaHorariaSemana: input.cargaHorariaSemana,
        numeroSemanas: input.numeroSemanas,
        publicoAlvo: input.publicoAlvo,
        estimativaPessoasBenificiadas: input.estimativaPessoasBenificiadas,
        status: input.status || PROJETO_STATUS_DRAFT,
      })

      if (disciplinaIdsToUse && disciplinaIdsToUse.length > 0) {
        const disciplinaValues = disciplinaIdsToUse.map((disciplinaId) => ({
          projetoId: novoProjeto.id,
          disciplinaId,
        }))
        await repo.insertProjetoDisciplinas(disciplinaValues)

        // Auto-associar professor à disciplina
        for (const disciplinaId of disciplinaIdsToUse) {
          const existingAssociation = await repo.findDisciplinaProfessorAssociation(
            disciplinaId,
            professorResponsavelId,
            input.ano,
            input.semestre
          )

          if (!existingAssociation) {
            await repo.insertDisciplinaProfessor({
              disciplinaId,
              professorId: professorResponsavelId,
              ano: input.ano,
              semestre: input.semestre,
            })

            log.info(
              {
                disciplinaId,
                professorId: professorResponsavelId,
                ano: input.ano,
                semestre: input.semestre,
              },
              'Professor auto-associado à disciplina durante criação do projeto'
            )
          }
        }
      }

      if (input.atividades && input.atividades.length > 0) {
        const atividadeValues = input.atividades.map((descricao) => ({
          projetoId: novoProjeto.id,
          descricao,
        }))
        await repo.insertAtividades(atividadeValues)
      }

      log.info({ projetoId: novoProjeto.id }, 'Projeto criado com sucesso')

      const projetoCompleto = await repo.findByIdWithRelations(novoProjeto.id)
      if (!projetoCompleto) {
        throw new BusinessError('Falha ao recuperar projeto recém criado', 'INTERNAL_ERROR')
      }

      const [disciplinas, atividades] = await Promise.all([
        repo.findDisciplinasByProjetoId(novoProjeto.id),
        repo.findAtividadesByProjetoId(novoProjeto.id),
      ])

      return {
        ...projetoCompleto,
        disciplinas,
        professoresParticipantes: [],
        atividades,
      }
    },

    async updateProjeto(input: UpdateProjetoInput) {
      const projeto = await repo.findById(input.id)
      if (!projeto) {
        throw new NotFoundError('Projeto', input.id)
      }

      if (input.userRole && isProfessor(input.userRole) && !isAdmin(input.userRole)) {
        const professor = input.userId ? await repo.findProfessorByUserId(input.userId) : null
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }

        if (projeto.status !== PROJETO_STATUS_DRAFT) {
          throw new BusinessError('Só é possível editar projetos em rascunho', 'BAD_REQUEST')
        }
      }

      const updateData: Record<string, unknown> = {}
      if (input.titulo !== undefined) updateData.titulo = input.titulo
      if (input.descricao !== undefined) updateData.descricao = input.descricao
      if (input.departamentoId !== undefined) updateData.departamentoId = input.departamentoId
      if (input.ano !== undefined) updateData.ano = input.ano
      if (input.semestre !== undefined) updateData.semestre = input.semestre
      if (input.tipoProposicao !== undefined) updateData.tipoProposicao = input.tipoProposicao
      if (input.bolsasSolicitadas !== undefined) updateData.bolsasSolicitadas = input.bolsasSolicitadas
      if (input.voluntariosSolicitados !== undefined) updateData.voluntariosSolicitados = input.voluntariosSolicitados
      if (input.cargaHorariaSemana !== undefined) updateData.cargaHorariaSemana = input.cargaHorariaSemana
      if (input.numeroSemanas !== undefined) updateData.numeroSemanas = input.numeroSemanas
      if (input.publicoAlvo !== undefined) updateData.publicoAlvo = input.publicoAlvo
      if (input.estimativaPessoasBenificiadas !== undefined)
        updateData.estimativaPessoasBenificiadas = input.estimativaPessoasBenificiadas
      if (input.status !== undefined) updateData.status = input.status

      await repo.update(input.id, updateData)

      const projetoCompleto = await repo.findByIdWithRelations(input.id)
      if (!projetoCompleto) {
        throw new BusinessError('Erro ao recuperar projeto atualizado', 'INTERNAL_ERROR')
      }

      const [disciplinas, atividades] = await Promise.all([
        repo.findDisciplinasByProjetoId(input.id),
        repo.findAtividadesByProjetoId(input.id),
      ])

      return {
        ...projetoCompleto,
        disciplinas,
        professoresParticipantes: [],
        atividades,
      }
    },

    async deleteProjeto(id: number, userId: number, userRole: UserRole) {
      const projeto = await repo.findById(id)
      if (!projeto) {
        throw new NotFoundError('Projeto', id)
      }

      if (isProfessor(userRole) && !isAdmin(userRole)) {
        const professor = await repo.findProfessorByUserId(userId)
        if (!professor || projeto.professorResponsavelId !== professor.id) {
          throw new ForbiddenError('Acesso negado a este projeto')
        }

        if (projeto.status !== PROJETO_STATUS_DRAFT) {
          throw new BusinessError('Só é possível excluir projetos em rascunho', 'BAD_REQUEST')
        }
      }

      if (isAdmin(userRole)) {
        log.info({ projetoId: id, adminUserId: userId }, 'Admin deletando projeto')
      }

      await repo.softDelete(id)
      log.info({ projetoId: id }, 'Projeto excluído com sucesso')
    },

    async updateVolunteerStatus(id: number, status: 'ATIVO' | 'INATIVO', userId: number, _userRole: UserRole) {
      const professor = await repo.findProfessorByUserId(userId)
      if (!professor) {
        throw new NotFoundError('Professor', userId)
      }

      const inscricao = await repo.findInscricaoByAlunoIdAndStatus(id, ACCEPTED_VOLUNTARIO)
      if (!inscricao || inscricao.projeto.professorResponsavelId !== professor.id) {
        throw new NotFoundError('Voluntário', id)
      }

      log.info({ alunoId: id, newStatus: status }, 'Status do voluntário atualizado')
    },
  }
}

export type ProjetoCreationService = ReturnType<typeof createProjetoCreationService>
