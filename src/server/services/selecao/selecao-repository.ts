import type { db } from '@/server/db'
import {
  assinaturaDocumentoTable,
  ataSelecaoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/db/schema'
import {
  PROJETO_STATUS_APPROVED,
  STATUS_INSCRICAO_SUBMITTED,
  TIPO_ASSINATURA_ATA_SELECAO,
  type Semestre,
} from '@/types'
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm'
import { and, desc, eq, ilike, inArray, isNotNull, isNull, or } from 'drizzle-orm'

// Types for pagination filters
export interface SelecaoAdminFilters {
  ano?: number
  semestre?: Semestre
  departamentoId?: number
  projetoTitulo?: string
  professorResponsavel?: string
  status?: string | string[]
  limit?: number
  offset?: number
}

export interface AtasAdminFilters extends SelecaoAdminFilters {
  status?: 'DRAFT' | 'SIGNED'
}

export interface SelecaoStats {
  total: number
  pendente: number
  emSelecao: number
  assinado: number
}

export interface AtasStats {
  total: number
  rascunho: number
  assinado: number
}

export type AtaSelecaoInsert = InferInsertModel<typeof ataSelecaoTable>
export type AssinaturaDocumentoInsert = InferInsertModel<typeof assinaturaDocumentoTable>
export type InscricaoSelect = InferSelectModel<typeof inscricaoTable>

type Database = typeof db

export function createSelecaoRepository(db: Database) {
  return {
    // Projeto queries
    async findProjetoById(projetoId: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, projetoId),
      })
    },

    async findProjetoWithRelations(projetoId: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, projetoId),
        with: {
          departamento: true,
          editalInterno: true,
          professorResponsavel: {
            with: { user: true },
          },
        },
      })
    },

    async findProfessorApprovedProjects(professorId: number) {
      return db.query.projetoTable.findMany({
        where: and(
          eq(projetoTable.professorResponsavelId, professorId),
          eq(projetoTable.status, PROJETO_STATUS_APPROVED)
        ),
        with: {
          departamento: true,
          inscricoes: {
            with: {
              aluno: {
                with: { user: true },
              },
            },
            orderBy: [desc(inscricaoTable.notaFinal)],
          },
          disciplinas: {
            with: {
              disciplina: true,
            },
          },
        },
      })
    },

    // Professor queries
    async findProfessorByUserId(userId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },

    // Inscricao queries
    async findInscricaoById(inscricaoId: number) {
      return db.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, inscricaoId),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
        },
      })
    },

    async findInscricoesByProjetoId(projetoId: number) {
      return db.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.projetoId, projetoId),
        with: {
          aluno: {
            with: { user: true },
          },
        },
      })
    },

    async findInscricoesWithNotaFinal(projetoId: number) {
      return db.query.inscricaoTable.findMany({
        where: and(eq(inscricaoTable.projetoId, projetoId), isNotNull(inscricaoTable.notaFinal)),
        with: {
          aluno: {
            with: { user: true },
          },
        },
        orderBy: [desc(inscricaoTable.notaFinal)],
      })
    },

    // Disciplina queries
    async findDisciplinasByProjetoId(projetoId: number) {
      return db
        .select()
        .from(disciplinaTable)
        .innerJoin(projetoDisciplinaTable, eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId))
        .where(eq(projetoDisciplinaTable.projetoId, projetoId))
    },

    // Ata queries
    async findAtaByProjetoId(projetoId: number) {
      return db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.projetoId, projetoId),
      })
    },

    async findAtaById(ataId: number) {
      return db.query.ataSelecaoTable.findFirst({
        where: eq(ataSelecaoTable.id, ataId),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
        },
      })
    },

    async findAtasByProfessorId(_userId: number) {
      return db.query.ataSelecaoTable.findMany({
        with: {
          projeto: {
            with: {
              professorResponsavel: {
                with: { user: true },
              },
              departamento: true,
            },
          },
        },
      })
    },

    // Assinatura queries
    async findAssinatura(projetoId: number, userId: number) {
      return db.query.assinaturaDocumentoTable.findFirst({
        where: and(
          eq(assinaturaDocumentoTable.projetoId, projetoId),
          eq(assinaturaDocumentoTable.userId, userId),
          eq(assinaturaDocumentoTable.tipoAssinatura, TIPO_ASSINATURA_ATA_SELECAO)
        ),
      })
    },

    // Mutations
    async createAta(data: AtaSelecaoInsert) {
      const [ataRecord] = await db.insert(ataSelecaoTable).values(data).returning()
      return ataRecord
    },

    async createAssinatura(data: AssinaturaDocumentoInsert) {
      await db.insert(assinaturaDocumentoTable).values(data)
    },

    async updateAtaAssinado(ataId: number) {
      await db
        .update(ataSelecaoTable)
        .set({
          assinado: true,
          dataAssinatura: new Date(),
        })
        .where(eq(ataSelecaoTable.id, ataId))
    },

    async updateInscricaoStatus(inscricaoId: number, status: InscricaoSelect['status'], feedbackProfessor?: string) {
      const updateData: Record<string, unknown> = { status }
      if (feedbackProfessor !== undefined) {
        updateData.feedbackProfessor = feedbackProfessor
      }
      await db.update(inscricaoTable).set(updateData).where(eq(inscricaoTable.id, inscricaoId))
    },

    async resetInscricoes(projetoId: number) {
      await db
        .update(inscricaoTable)
        .set({ status: STATUS_INSCRICAO_SUBMITTED })
        .where(eq(inscricaoTable.projetoId, projetoId))
    },

    async getAllInscricaoIdsByProjetoId(projetoId: number) {
      return db.select({ id: inscricaoTable.id }).from(inscricaoTable).where(eq(inscricaoTable.projetoId, projetoId))
    },

    // ========================================
    // ADMIN QUERIES (PAGINATED)
    // ========================================

    async findAllProjectsWithSelectionStatus(filters: SelecaoAdminFilters) {
      const conditions: SQL[] = [eq(projetoTable.status, PROJETO_STATUS_APPROVED), isNull(projetoTable.deletedAt)]

      if (filters.ano) {
        conditions.push(eq(projetoTable.ano, filters.ano))
      }
      if (filters.semestre) {
        conditions.push(eq(projetoTable.semestre, filters.semestre))
      }
      if (filters.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }
      if (filters.projetoTitulo) {
        conditions.push(ilike(projetoTable.titulo, `%${filters.projetoTitulo}%`))
      }

      if (filters.professorResponsavel) {
        const profProjetos = await db
          .select({ id: projetoTable.id })
          .from(projetoTable)
          .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
          .where(ilike(professorTable.nomeCompleto, `%${filters.professorResponsavel}%`))
        const profProjetoIds = profProjetos.map((p) => p.id)
        if (profProjetoIds.length === 0) {
          return { items: [], total: 0, stats: { total: 0, pendente: 0, emSelecao: 0, assinado: 0 } }
        }
        conditions.push(inArray(projetoTable.id, profProjetoIds))
      }

      // Query projects matching SQL filters
      const [projetos, statsResult] = await Promise.all([
        db.query.projetoTable.findMany({
          where: and(...conditions),
          with: {
            departamento: true,
            professorResponsavel: true,
            inscricoes: {
              columns: {
                id: true,
                status: true,
                tipoVagaPretendida: true,
              },
            },
          },
          orderBy: [desc(projetoTable.createdAt)],
        }),
        this.getSelecaoStats(conditions),
      ])

      // Fetch all atas for these projects in a single query
      const projetoIds = projetos.map((p) => p.id)
      const atas =
        projetoIds.length > 0
          ? await db.query.ataSelecaoTable.findMany({
              where: inArray(ataSelecaoTable.projetoId, projetoIds),
            })
          : []

      const atasByProjetoId = new Map(atas.map((a) => [a.projetoId, a]))

      let items = projetos.map((projeto) => {
        const ata = atasByProjetoId.get(projeto.id)
        const selecaoStatus = ata?.assinado
          ? 'ASSINADO'
          : ata
            ? 'RASCUNHO'
            : projeto.inscricoes.some((i) => i.status?.startsWith('SELECTED_'))
              ? 'EM_SELECAO'
              : 'PENDENTE'

        return {
          id: projeto.id,
          titulo: projeto.titulo,
          ano: projeto.ano,
          semestre: projeto.semestre,
          professorResponsavel: projeto.professorResponsavel.nomeCompleto,
          departamento: projeto.departamento?.sigla || projeto.departamento?.nome,
          totalInscritos: projeto.inscricoes.length,
          bolsistasDisponibilizados: projeto.bolsasDisponibilizadas || 0,
          bolsistasSelecionados: projeto.inscricoes.filter((i) => i.status?.startsWith('SELECTED_BOLSISTA')).length,
          voluntariosSelecionados: projeto.inscricoes.filter((i) => i.status?.startsWith('SELECTED_VOLUNTARIO')).length,
          hasAta: !!ata,
          ataAssinada: ata?.assinado ?? false,
          selecaoStatus,
        }
      })

      if (filters.status) {
        const statusList = Array.isArray(filters.status) ? filters.status : [filters.status]
        if (statusList.length > 0) {
          items = items.filter((item) => statusList.includes(item.selecaoStatus))
        }
      }

      const total = items.length
      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 20
      const paginatedItems = items.slice(offset, offset + limit)

      return {
        items: paginatedItems,
        total,
        stats: statsResult,
      }
    },

    // Calculate stats for selection status (requires separate query for accuracy across all data)
    async getSelecaoStats(conditions: ReturnType<typeof eq>[]): Promise<SelecaoStats> {
      // Get all projects matching filters to calculate stats
      const allProjetos = await db.query.projetoTable.findMany({
        where: and(...conditions),
        columns: { id: true },
        with: {
          inscricoes: {
            columns: { status: true },
          },
        },
      })

      const projetoIds = allProjetos.map((p) => p.id)
      const atas =
        projetoIds.length > 0
          ? await db.query.ataSelecaoTable.findMany({
              where: inArray(ataSelecaoTable.projetoId, projetoIds),
              columns: { projetoId: true, assinado: true },
            })
          : []

      const atasByProjetoId = new Map(atas.map((a) => [a.projetoId, a]))

      let pendente = 0
      let emSelecao = 0
      let assinado = 0

      for (const projeto of allProjetos) {
        const ata = atasByProjetoId.get(projeto.id)
        if (ata?.assinado) {
          assinado++
        } else if (ata) {
          emSelecao++ // Has draft ata
        } else if (projeto.inscricoes.some((i) => i.status?.startsWith('SELECTED_'))) {
          emSelecao++
        } else {
          pendente++
        }
      }

      return {
        total: allProjetos.length,
        pendente,
        emSelecao,
        assinado,
      }
    },

    async findAllAtasForAdmin(filters: AtasAdminFilters) {
      const projetoConditions: SQL[] = [
        eq(projetoTable.status, PROJETO_STATUS_APPROVED),
        isNull(projetoTable.deletedAt),
      ]

      if (filters.ano) {
        projetoConditions.push(eq(projetoTable.ano, filters.ano))
      }
      if (filters.semestre) {
        projetoConditions.push(eq(projetoTable.semestre, filters.semestre))
      }
      if (filters.departamentoId) {
        projetoConditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }
      if (filters.projetoTitulo) {
        projetoConditions.push(ilike(projetoTable.titulo, `%${filters.projetoTitulo}%`))
      }
      if (filters.professorResponsavel) {
        projetoConditions.push(ilike(professorTable.nomeCompleto, `%${filters.professorResponsavel}%`))
      }

      const whereClause = and(...projetoConditions)

      // Query projects with professor and department
      const projetos = await db.query.projetoTable.findMany({
        where: whereClause,
        with: {
          professorResponsavel: true,
          departamento: true,
        },
        orderBy: [desc(projetoTable.ano), desc(projetoTable.createdAt)],
      })

      const projetoIds = projetos.map((p) => p.id)

      const [atas, inscricoesComResultado] = await Promise.all([
        projetoIds.length > 0
          ? db.query.ataSelecaoTable.findMany({
              where: inArray(ataSelecaoTable.projetoId, projetoIds),
              with: {
                geradoPor: true,
              },
            })
          : [],
        projetoIds.length > 0
          ? db
              .select({ projetoId: inscricaoTable.projetoId })
              .from(inscricaoTable)
              .where(
                and(
                  inArray(inscricaoTable.projetoId, projetoIds),
                  or(ilike(inscricaoTable.status, 'SELECTED_%'), eq(inscricaoTable.status, 'REJECTED_BY_PROFESSOR'))
                )
              )
          : [],
      ])

      const atasMap = new Map(atas.map((a) => [a.projetoId, a]))
      const publishedProjetoIds = new Set([
        ...atas.map((a) => a.projetoId),
        ...inscricoesComResultado.map((i) => i.projetoId),
      ])

      // Only display projects where the professor published results or generated an ata
      const publishedProjetos = projetos.filter((p) => publishedProjetoIds.has(p.id))

      let items = publishedProjetos.map((projeto) => {
        const ata = atasMap.get(projeto.id)
        const status = ata?.assinado ? 'ASSINADO' : 'RASCUNHO'

        return {
          id: ata?.id ?? projeto.id,
          projetoId: projeto.id,
          projetoTitulo: projeto.titulo,
          professorResponsavel: projeto.professorResponsavel.nomeCompleto,
          departamento: projeto.departamento?.sigla || projeto.departamento?.nome,
          ano: projeto.ano,
          semestre: projeto.semestre,
          geradoPor: ata?.geradoPor?.username,
          dataGeracao: ata?.dataGeracao ?? null,
          assinado: ata?.assinado ?? false,
          dataAssinatura: ata?.dataAssinatura ?? null,
          status,
        }
      })

      if (filters.status) {
        items = items.filter((item) => item.status === filters.status)
      }

      const total = items.length

      // Paginate
      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 20
      const paginatedItems = items.slice(offset, offset + limit)

      // Stats across all published projects
      const totalPublished = publishedProjetos.length
      const assinadoCount = publishedProjetos.filter((p) => atasMap.get(p.id)?.assinado).length
      const rascunhoCount = totalPublished - assinadoCount

      return {
        items: paginatedItems,
        total,
        stats: {
          total: totalPublished,
          rascunho: rascunhoCount,
          assinado: assinadoCount,
        },
      }
    },
  }
}
