import { BusinessError, NotFoundError } from '@/server/lib/errors'
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

      // Check for active projetos - can't delete if there are active projects
      const projetosAtivos = await repository.countProjetosAtivos(id)
      if (projetosAtivos > 0) {
        throw new BusinessError(
          `Não é possível excluir o departamento pois existem ${projetosAtivos} projeto(s) ativo(s) associado(s). Exclua os projetos primeiro.`,
          'CONFLICT'
        )
      }

      // Cascade deletion: handle all FK dependencies in correct order
      // 1. Get all disciplina IDs for this departamento
      const disciplinaIds = await repository.getDisciplinaIdsByDepartamento(id)

      // 2. Delete all FK references to disciplinas (order matters!)
      // 2.1 Delete disciplina_professor_responsavel references
      await repository.deleteDisciplinaProfessorResponsavelByDisciplinaIds(disciplinaIds)

      // 2.2 Delete projeto_disciplina references
      await repository.deleteProjetoDisciplinasByDisciplinaIds(disciplinaIds)

      // 2.3 Delete nota_aluno references
      await repository.deleteNotaAlunoByDisciplinaIds(disciplinaIds)

      // 2.4 Delete equivalencia_disciplinas references
      await repository.deleteEquivalenciaDisciplinasByDisciplinaIds(disciplinaIds)

      // 2.5 Delete projeto_template references
      await repository.deleteProjetoTemplatesByDisciplinaIds(disciplinaIds)

      // 3. Delete disciplinas
      await repository.deleteDisciplinasByDepartamento(id)

      // 4. Finally delete the departamento
      await repository.delete(id)
      return { success: true }
    },
  }
}

export type DepartamentoService = ReturnType<typeof createDepartamentoService>
