import { NotFoundError } from '@/server/lib/errors'
import type { TipoCurso, ModalidadeCurso, StatusCurso } from '@/types'
import { STATUS_CURSO_ATIVO } from '@/types'
import type { CourseRepository } from './course-repository'

export function createCourseService(repository: CourseRepository) {
  return {
    async getCourses(includeStats: boolean) {
      const cursos = await repository.findAll()

      if (!includeStats) {
        return cursos
      }

      return Promise.all(
        cursos.map(async (curso) => ({
          ...curso,
          alunos: await repository.countAlunos(curso.id),
          disciplinas: await repository.countDisciplinas(curso.departamentoId),
          projetos: await repository.countProjetos(curso.departamentoId),
        }))
      )
    },

    async getCourse(id: number) {
      const curso = await repository.findById(id)
      if (!curso) {
        throw new NotFoundError('Curso', id)
      }
      return curso
    },

    async createCourse(data: {
      nome: string
      codigo: number
      tipo: TipoCurso
      modalidade: ModalidadeCurso
      duracao: number
      departamentoId: number
      cargaHoraria: number
      descricao?: string
      coordenador?: string
      emailCoordenacao?: string
      status?: StatusCurso
    }) {
      return repository.insert({
        ...data,
        status: data.status || STATUS_CURSO_ATIVO,
      })
    },

    async updateCourse(
      id: number,
      data: {
        nome?: string
        codigo?: number
        tipo?: TipoCurso
        modalidade?: ModalidadeCurso
        duracao?: number
        departamentoId?: number
        cargaHoraria?: number
        descricao?: string | null
        coordenador?: string | null
        emailCoordenacao?: string | null
        status?: StatusCurso
      }
    ) {
      const curso = await repository.update(id, data)
      if (!curso) {
        throw new NotFoundError('Curso', id)
      }
      return curso
    },

    async deleteCourse(id: number) {
      const curso = await repository.findById(id)
      if (!curso) {
        throw new NotFoundError('Curso', id)
      }
      await repository.delete(id)
    },
  }
}

export type CourseService = ReturnType<typeof createCourseService>
