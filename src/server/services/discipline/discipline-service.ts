import type { db } from '@/server/db'
import { professorTable } from '@/server/db/schema'
import { BusinessError, ConflictError, ForbiddenError, NotFoundError } from '@/server/lib/errors'
import {
  type CheckEquivalenceData,
  type CreateEquivalenceData,
  type NewDisciplinaData,
  type Semestre,
  type UpdateDisciplineData,
  type UserRole,
  PROFESSOR,
  SEMESTRE_1,
  SEMESTRE_2,
} from '@/types'
import { logger } from '@/utils/logger'
import { eq } from 'drizzle-orm'
import { createDisciplineRepository } from './discipline-repository'

const log = logger.child({ context: 'DisciplineService' })

type Database = typeof db

export function createDisciplineService(db: Database) {
  const repo = createDisciplineRepository(db)

  return {
    async getDisciplineWithProfessor(id: number) {
      const disciplina = await repo.findById(id)

      if (!disciplina) {
        throw new NotFoundError('Disciplina', id)
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemestre: Semestre = now.getMonth() < 6 ? SEMESTRE_1 : SEMESTRE_2

      const professorResponsavel = await repo.findProfessorResponsavel(id, currentYear, currentSemestre)

      return {
        disciplina,
        professor: professorResponsavel[0]?.professor || null,
      }
    },

    async getAllDisciplines() {
      return repo.findAll()
    },

    async getDisciplineById(id: number) {
      const disciplina = await repo.findById(id)

      if (!disciplina) {
        throw new NotFoundError('Disciplina', id)
      }

      return disciplina
    },

    async createDiscipline(data: NewDisciplinaData) {
      return repo.create(data)
    },

    async updateDiscipline(input: UpdateDisciplineData) {
      const { id, ...updateData } = input
      const disciplina = await repo.update(id, updateData)

      if (!disciplina) {
        throw new NotFoundError('Disciplina', id)
      }

      return disciplina
    },

    async deleteDiscipline(id: number) {
      const disciplina = await repo.findById(id)

      if (!disciplina) {
        throw new NotFoundError('Disciplina', id)
      }

      await db.transaction(async (tx) => {
        const txRepo = createDisciplineRepository(tx)
        await txRepo.deleteDependencies(id)

        const result = await txRepo.delete(id)

        if (!result) {
          throw new BusinessError('Erro ao deletar disciplina', 'DELETE_FAILED')
        }

        log.info({ disciplinaId: id }, 'Disciplina e dependências deletadas com sucesso')
      })
    },

    async getProfessorDisciplines(userId: number, userRole: UserRole) {
      if (userRole !== PROFESSOR) {
        throw new ForbiddenError('Apenas professores podem ver suas disciplinas')
      }

      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })

      if (!professor) {
        throw new NotFoundError('Perfil de professor', 'não encontrado')
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemester: Semestre = now.getMonth() < 6 ? SEMESTRE_1 : SEMESTRE_2

      const disciplinasResponsavel = await repo.findProfessorDisciplinas(professor.id, currentYear, currentSemester)

      const disciplinaIds = disciplinasResponsavel
        .map((d) => d.disciplinaId)
        .filter((id) => typeof id === 'number' && !isNaN(id))

      if (disciplinaIds.length === 0) {
        return []
      }

      const disciplinas = await repo.findByIds(disciplinaIds)

      const projetosAtivos = await repo.getProjetosAtivos(disciplinaIds, professor.id, currentYear, currentSemester)
      const projetosMap = new Map(
        projetosAtivos.map((p: { disciplinaId: number; count: number }) => [p.disciplinaId, Number(p.count)])
      )

      const monitores = await repo.getMonitoresCounts(disciplinaIds, professor.id)
      const monitoresMap = new Map(
        monitores.map((m: { disciplinaId: number; bolsistas: number; voluntarios: number }) => [
          m.disciplinaId,
          { bolsistas: Number(m.bolsistas), voluntarios: Number(m.voluntarios) },
        ])
      )

      const result = disciplinas.map((disciplina) => {
        const projetosCount = projetosMap.get(disciplina.id) || 0
        const monitoresData = monitoresMap.get(disciplina.id) || { bolsistas: 0, voluntarios: 0 }

        return {
          id: disciplina.id,
          codigo: disciplina.codigo,
          nome: disciplina.nome,
          cargaHoraria: 60,
          projetosAtivos: projetosCount,
          monitoresAtivos: monitoresData.bolsistas,
          voluntariosAtivos: monitoresData.voluntarios,
        }
      })

      log.info('Disciplinas do professor recuperadas com sucesso')
      return result
    },

    async getDepartmentDisciplines(userId: number, userRole: UserRole) {
      if (userRole !== PROFESSOR) {
        throw new ForbiddenError('Apenas professores podem ver disciplinas do departamento')
      }

      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })

      if (!professor) {
        throw new NotFoundError('Perfil de professor', 'não encontrado')
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentSemester: Semestre = now.getMonth() < 6 ? SEMESTRE_1 : SEMESTRE_2

      const disciplinas = professor.departamentoId
        ? await repo.findByDepartmentId(professor.departamentoId)
        : await repo.findAll()

      const associacoes = await repo.getProfessorAssociations(professor.id, currentYear, currentSemester)
      const associacoesMap = new Map(
        associacoes.map((a: { disciplinaId: number; ano: number; semestre: Semestre }) => [
          a.disciplinaId,
          { ano: a.ano, semestre: a.semestre },
        ])
      )

      return disciplinas.map((disciplina) => {
        const associacao = associacoesMap.get(disciplina.id) as { ano: number; semestre: Semestre } | undefined
        return {
          id: disciplina.id,
          codigo: disciplina.codigo,
          nome: disciplina.nome,
          departamentoId: disciplina.departamentoId,
          isAssociated: !!associacao,
          ano: associacao?.ano,
          semestre: associacao?.semestre,
        }
      })
    },

    async associateDiscipline(
      disciplinaId: number,
      ano: number,
      semestre: Semestre,
      userId: number,
      userRole: UserRole
    ) {
      if (userRole !== PROFESSOR) {
        throw new ForbiddenError('Apenas professores podem se associar a disciplinas')
      }

      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })

      if (!professor) {
        throw new NotFoundError('Perfil de professor', 'não encontrado')
      }

      const disciplina = await repo.findById(disciplinaId)

      if (!disciplina) {
        throw new NotFoundError('Disciplina', disciplinaId)
      }

      if (professor.departamentoId && disciplina.departamentoId !== professor.departamentoId) {
        throw new ForbiddenError('Você só pode se associar a disciplinas do seu departamento')
      }

      const existingAssociation = await repo.findAssociation(disciplinaId, professor.id, ano, semestre)

      if (existingAssociation) {
        throw new ConflictError('Você já está associado a esta disciplina neste período')
      }

      await repo.createAssociation({
        disciplinaId,
        professorId: professor.id,
        ano,
        semestre,
      })

      log.info({ professorId: professor.id, disciplinaId }, 'Professor associado à disciplina')
      return { success: true }
    },

    async disassociateDiscipline(
      disciplinaId: number,
      ano: number,
      semestre: Semestre,
      userId: number,
      userRole: UserRole
    ) {
      if (userRole !== PROFESSOR) {
        throw new ForbiddenError('Apenas professores podem se desassociar de disciplinas')
      }

      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })

      if (!professor) {
        throw new NotFoundError('Perfil de professor', 'não encontrado')
      }

      const result = await repo.deleteAssociation(disciplinaId, professor.id, ano, semestre)

      if (!result.length) {
        throw new NotFoundError('Associação', 'não encontrada')
      }

      log.info({ professorId: professor.id, disciplinaId }, 'Professor desassociado da disciplina')
      return { success: true }
    },

    async listEquivalences() {
      const equivalences = await repo.findAllEquivalences()

      const disciplinaIds = [
        ...new Set([
          ...equivalences.map((e) => e.disciplinaOrigemId),
          ...equivalences.map((e) => e.disciplinaEquivalenteId),
        ]),
      ]

      const disciplinas = await repo.findByIds(disciplinaIds)
      const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))

      return equivalences.map((eq) => {
        const origem = disciplinaMap.get(eq.disciplinaOrigemId)
        const equivalente = disciplinaMap.get(eq.disciplinaEquivalenteId)

        if (!origem || !equivalente) {
          throw new BusinessError('Disciplina não encontrada para equivalência', 'MISSING_DISCIPLINE')
        }

        return {
          id: eq.id,
          disciplinaOrigem: {
            id: origem.id,
            codigo: origem.codigo,
            nome: origem.nome,
          },
          disciplinaEquivalente: {
            id: equivalente.id,
            codigo: equivalente.codigo,
            nome: equivalente.nome,
          },
          createdAt: eq.createdAt,
        }
      })
    },

    async createEquivalence(input: CreateEquivalenceData) {
      const [disciplinaOrigem, disciplinaEquivalente] = await Promise.all([
        repo.findById(input.disciplinaOrigemId),
        repo.findById(input.disciplinaEquivalenteId),
      ])

      if (!disciplinaOrigem || !disciplinaEquivalente) {
        throw new NotFoundError('Disciplina', 'Uma ou ambas as disciplinas não foram encontradas')
      }

      const existingEquivalence = await repo.findEquivalence(input.disciplinaOrigemId, input.disciplinaEquivalenteId)

      if (existingEquivalence) {
        throw new ConflictError('Equivalência já existe entre estas disciplinas')
      }

      const result = await repo.createEquivalence({
        disciplinaOrigemId: input.disciplinaOrigemId,
        disciplinaEquivalenteId: input.disciplinaEquivalenteId,
      })

      if (!result) {
        throw new BusinessError('Erro ao criar equivalência', 'CREATE_FAILED')
      }

      log.info(
        {
          disciplinaOrigemId: input.disciplinaOrigemId,
          disciplinaEquivalenteId: input.disciplinaEquivalenteId,
        },
        'Equivalência criada com sucesso'
      )

      return { success: true, id: result.id }
    },

    async deleteEquivalence(id: number) {
      const result = await repo.deleteEquivalence(id)

      if (!result) {
        throw new NotFoundError('Equivalência', id)
      }

      log.info({ equivalenceId: id }, 'Equivalência deletada com sucesso')
      return { success: true }
    },

    async checkEquivalence(input: CheckEquivalenceData) {
      const equivalence = await repo.findEquivalence(input.disciplinaOrigemId, input.disciplinaEquivalenteId)

      return { isEquivalent: !!equivalence }
    },
  }
}

export type DisciplineService = ReturnType<typeof createDisciplineService>
