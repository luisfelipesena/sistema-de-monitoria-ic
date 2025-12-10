import { NotFoundError } from '@/server/lib/errors'
import type { DepartamentoRepository } from './departamento-repository'

export function createDepartamentoService(repository: DepartamentoRepository) {
  return {
    async getDepartamentos(includeStats: boolean) {
      const departamentos = await repository.findAll()

      if (!includeStats) {
        return departamentos
      }

      return Promise.all(
        departamentos.map(async (departamento) => ({
          ...departamento,
          professores: await repository.countProfessores(departamento.id),
          disciplinas: await repository.countDisciplinas(departamento.id),
          projetos: await repository.countProjetos(departamento.id),
        }))
      )
    },

    async getDepartamento(id: number) {
      const departamento = await repository.findById(id)
      if (!departamento) {
        throw new NotFoundError('Departamento', id)
      }
      return departamento
    },

    async createDepartamento(data: {
      nome: string
      unidadeUniversitaria: string
      sigla?: string
      coordenador?: string
      email?: string | null
      telefone?: string
      descricao?: string
    }) {
      return repository.insert(data)
    },

    async updateDepartamento(
      id: number,
      data: {
        nome?: string
        sigla?: string | null
        unidadeUniversitaria?: string
        coordenador?: string | null
        email?: string | null
        telefone?: string | null
        descricao?: string | null
      }
    ) {
      const departamento = await repository.findById(id)
      if (!departamento) {
        throw new NotFoundError('Departamento', id)
      }

      return repository.update(id, data)
    },

    async deleteDepartamento(id: number) {
      const departamento = await repository.findById(id)
      if (!departamento) {
        throw new NotFoundError('Departamento', id)
      }

      // Cascade deletion: handle all FK dependencies in correct order
      // 1. Soft delete all projetos referencing this departamento
      await repository.softDeleteProjetosByDepartamento(id)

      // 2. Get all disciplina IDs for this departamento
      const disciplinaIds = await repository.getDisciplinaIdsByDepartamento(id)

      // 3. Delete all FK references to disciplinas (order matters!)
      // 3.1 Delete disciplina_professor_responsavel references
      await repository.deleteDisciplinaProfessorResponsavelByDisciplinaIds(disciplinaIds)

      // 3.2 Delete projeto_disciplina references
      await repository.deleteProjetoDisciplinasByDisciplinaIds(disciplinaIds)

      // 3.3 Delete nota_aluno references
      await repository.deleteNotaAlunoByDisciplinaIds(disciplinaIds)

      // 3.4 Delete equivalencia_disciplinas references
      await repository.deleteEquivalenciaDisciplinasByDisciplinaIds(disciplinaIds)

      // 3.5 Delete projeto_template references
      await repository.deleteProjetoTemplatesByDisciplinaIds(disciplinaIds)

      // 4. Delete disciplinas
      await repository.deleteDisciplinasByDepartamento(id)

      // 5. Nullify departamentoId on professors (don't delete professors)
      await repository.nullifyProfessorsDepartamento(id)

      // 6. Finally delete the departamento
      await repository.delete(id)
      return { success: true }
    },
  }
}

export type DepartamentoService = ReturnType<typeof createDepartamentoService>
