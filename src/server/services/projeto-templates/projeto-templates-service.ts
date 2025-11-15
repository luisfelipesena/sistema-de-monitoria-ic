import type { db } from '@/server/db'
import { ConflictError, NotFoundError } from '@/server/lib/errors'
import { createProjetoTemplatesRepository } from './projeto-templates-repository'

type Database = typeof db

interface CreateTemplateInput {
  disciplinaId: number
  tituloDefault?: string
  descricaoDefault?: string
  cargaHorariaSemanaDefault?: number
  numeroSemanasDefault?: number
  publicoAlvoDefault?: string
  atividadesDefault?: string[]
  pontosProvaDefault?: string
  bibliografiaDefault?: string
}

interface UpdateTemplateInput {
  id: number
  tituloDefault?: string
  descricaoDefault?: string
  cargaHorariaSemanaDefault?: number
  numeroSemanasDefault?: number
  publicoAlvoDefault?: string
  atividadesDefault?: string[]
  pontosProvaDefault?: string
  bibliografiaDefault?: string
}

interface DuplicateTemplateInput {
  sourceId: number
  targetDisciplinaId: number
}

export function createProjetoTemplatesService(db: Database) {
  const repo = createProjetoTemplatesRepository(db)

  function parseAtividades(atividadesDefault: string | null): string[] {
    if (!atividadesDefault) return []
    try {
      return JSON.parse(atividadesDefault)
    } catch {
      return []
    }
  }

  return {
    async getAllTemplates() {
      const templates = await repo.findAll()

      return templates.map((template) => ({
        id: template.id,
        disciplinaId: template.disciplinaId,
        tituloDefault: template.tituloDefault,
        descricaoDefault: template.descricaoDefault,
        cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: template.numeroSemanasDefault,
        publicoAlvoDefault: template.publicoAlvoDefault,
        atividadesDefault: parseAtividades(template.atividadesDefault),
        pontosProvaDefault: template.pontosProvaDefault,
        bibliografiaDefault: template.bibliografiaDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        disciplina: {
          id: template.disciplina.id,
          nome: template.disciplina.nome,
          codigo: template.disciplina.codigo,
          departamento: template.disciplina.departamento,
        },
        criadoPor: template.criadoPor,
        ultimaAtualizacaoPor: template.ultimaAtualizacaoPor,
      }))
    },

    async getTemplatesForProfessor() {
      const templates = await repo.findAllSimple()

      return templates.map((template) => ({
        id: template.id,
        disciplinaId: template.disciplinaId,
        tituloDefault: template.tituloDefault,
        descricaoDefault: template.descricaoDefault,
        cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault,
        numeroSemanasDefault: template.numeroSemanasDefault,
        publicoAlvoDefault: template.publicoAlvoDefault,
        atividadesDefault: parseAtividades(template.atividadesDefault),
        pontosProvaDefault: template.pontosProvaDefault,
        bibliografiaDefault: template.bibliografiaDefault,
        disciplina: {
          id: template.disciplina.id,
          nome: template.disciplina.nome,
          codigo: template.disciplina.codigo,
          departamento: template.disciplina.departamento,
        },
      }))
    },

    async getTemplate(id: number) {
      const template = await repo.findById(id)

      if (!template) {
        throw new NotFoundError('Template', id)
      }

      return {
        ...template,
        atividadesDefault: parseAtividades(template.atividadesDefault),
      }
    },

    async createTemplate(input: CreateTemplateInput, userId: number) {
      const existingTemplate = await repo.findByDisciplinaId(input.disciplinaId)

      if (existingTemplate) {
        throw new ConflictError('Já existe um template para esta disciplina')
      }

      const { atividadesDefault, pontosProvaDefault, bibliografiaDefault, ...templateData } = input

      return repo.create({
        ...templateData,
        atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
        pontosProvaDefault: pontosProvaDefault || null,
        bibliografiaDefault: bibliografiaDefault || null,
        criadoPorUserId: userId,
      })
    },

    async updateTemplate(input: UpdateTemplateInput, userId: number) {
      const { id, atividadesDefault, pontosProvaDefault, bibliografiaDefault, ...updateData } = input

      const template = await repo.findById(id)

      if (!template) {
        throw new NotFoundError('Template', id)
      }

      return repo.update(id, {
        ...updateData,
        atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
        pontosProvaDefault,
        bibliografiaDefault,
        ultimaAtualizacaoUserId: userId,
      })
    },

    async deleteTemplate(id: number) {
      const template = await repo.findById(id)

      if (!template) {
        throw new NotFoundError('Template', id)
      }

      await repo.delete(id)
      return { success: true }
    },

    async getAvailableDisciplines() {
      const allDisciplinas = await repo.findAllDisciplinas()
      const templatesExistentes = await repo.findAllTemplateIds()

      const disciplinasComTemplate = new Set(templatesExistentes.map((t) => t.disciplinaId))

      return allDisciplinas.filter((d) => !disciplinasComTemplate.has(d.id))
    },

    async getTemplateByDisciplina(disciplinaId: number) {
      const template = await repo.findByDisciplinaId(disciplinaId)

      if (!template) {
        return null
      }

      return {
        ...template,
        atividadesDefault: parseAtividades(template.atividadesDefault),
      }
    },

    async duplicateTemplate(input: DuplicateTemplateInput, userId: number) {
      const sourceTemplate = await repo.findById(input.sourceId)

      if (!sourceTemplate) {
        throw new NotFoundError('Template fonte', input.sourceId)
      }

      const existingTemplate = await repo.findByDisciplinaId(input.targetDisciplinaId)

      if (existingTemplate) {
        throw new ConflictError('A disciplina de destino já possui um template')
      }

      return repo.create({
        disciplinaId: input.targetDisciplinaId,
        tituloDefault: sourceTemplate.tituloDefault,
        descricaoDefault: sourceTemplate.descricaoDefault,
        cargaHorariaSemanaDefault: sourceTemplate.cargaHorariaSemanaDefault,
        numeroSemanasDefault: sourceTemplate.numeroSemanasDefault,
        publicoAlvoDefault: sourceTemplate.publicoAlvoDefault,
        atividadesDefault: sourceTemplate.atividadesDefault,
        criadoPorUserId: userId,
      })
    },

    async getTemplateStats() {
      const totalTemplates = await repo.countTemplates()
      const totalDisciplinas = await repo.countDisciplinas()

      return {
        totalTemplates,
        totalDisciplinas,
        cobertura: totalDisciplinas > 0 ? Math.round((totalTemplates / totalDisciplinas) * 100) : 0,
        disciplinasSemTemplate: totalDisciplinas - totalTemplates,
      }
    },

    async upsertTemplateByProfessor(input: CreateTemplateInput, userId: number) {
      const existingTemplate = await repo.findByDisciplinaId(input.disciplinaId)

      const { disciplinaId, atividadesDefault, pontosProvaDefault, bibliografiaDefault, ...templateData } = input

      if (existingTemplate) {
        const updated = await repo.update(existingTemplate.id, {
          ...templateData,
          atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
          pontosProvaDefault,
          bibliografiaDefault,
          ultimaAtualizacaoUserId: userId,
        })

        return { ...updated, isNew: false }
      }

      const template = await repo.create({
        disciplinaId,
        ...templateData,
        atividadesDefault: atividadesDefault ? JSON.stringify(atividadesDefault) : null,
        pontosProvaDefault: pontosProvaDefault || null,
        bibliografiaDefault: bibliografiaDefault || null,
        criadoPorUserId: userId,
      })

      return { ...template, isNew: true }
    },
  }
}

export type ProjetoTemplatesService = ReturnType<typeof createProjetoTemplatesService>
