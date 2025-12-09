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

      await repository.delete(id)
      return { success: true }
    },
  }
}

export type DepartamentoService = ReturnType<typeof createDepartamentoService>
