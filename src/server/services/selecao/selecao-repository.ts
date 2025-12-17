import type { db } from '@/server/db'
import {
  alunoTable,
  assinaturaDocumentoTable,
  ataSelecaoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  userTable,
} from '@/server/db/schema'
import {
  PROJETO_STATUS_APPROVED,
  STATUS_INSCRICAO_SUBMITTED,
  TIPO_ASSINATURA_ATA_SELECAO,
  type Semestre,
} from '@/types'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { and, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'

// Types for pagination filters
export interface SelecaoAdminFilters {
  ano?: number
  semestre?: Semestre
  departamentoId?: number
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

    async updateInscricaoStatus(inscricaoId: number, status: InscricaoSelect['status']) {
      await db.update(inscricaoTable).set({ status }).where(eq(inscricaoTable.id, inscricaoId))
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
      const conditions = [eq(projetoTable.status, PROJETO_STATUS_APPROVED)]

      if (filters.ano) {
        conditions.push(eq(projetoTable.ano, filters.ano))
      }
      if (filters.semestre) {
        conditions.push(eq(projetoTable.semestre, filters.semestre))
      }
      if (filters.departamentoId) {
        conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }

      // Parallel queries: items + total count + stats
      const [projetos, totalResult, statsResult] = await Promise.all([
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
          limit: filters.limit,
          offset: filters.offset,
        }),
        db.select({ count: count() }).from(projetoTable).where(and(...conditions)),
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

      // Create a map for quick lookup
      const atasByProjetoId = new Map(atas.map((a) => [a.projetoId, a]))

      const items = projetos.map((projeto) => {
        const ata = atasByProjetoId.get(projeto.id)
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
          selecaoStatus: ata?.assinado
            ? 'ASSINADO'
            : ata
              ? 'RASCUNHO'
              : projeto.inscricoes.some((i) => i.status?.startsWith('SELECTED_'))
                ? 'EM_SELECAO'
                : 'PENDENTE',
        }
      })

      return {
        items,
        total: totalResult[0]?.count ?? 0,
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
      // Build conditions for SQL filtering (more efficient than JS filtering)
      const ataConditions: ReturnType<typeof eq>[] = []
      const projetoConditions: ReturnType<typeof eq>[] = []

      if (filters.status === 'SIGNED') {
        ataConditions.push(eq(ataSelecaoTable.assinado, true))
      } else if (filters.status === 'DRAFT') {
        ataConditions.push(eq(ataSelecaoTable.assinado, false))
      }

      if (filters.ano) {
        projetoConditions.push(eq(projetoTable.ano, filters.ano))
      }
      if (filters.semestre) {
        projetoConditions.push(eq(projetoTable.semestre, filters.semestre))
      }
      if (filters.departamentoId) {
        projetoConditions.push(eq(projetoTable.departamentoId, filters.departamentoId))
      }

      // Get projeto IDs that match filters
      let projetoIds: number[] | undefined
      if (projetoConditions.length > 0) {
        const projetos = await db
          .select({ id: projetoTable.id })
          .from(projetoTable)
          .where(and(...projetoConditions))
        projetoIds = projetos.map((p) => p.id)
        if (projetoIds.length === 0) {
          return { items: [], total: 0, stats: { total: 0, rascunho: 0, assinado: 0 } }
        }
        ataConditions.push(inArray(ataSelecaoTable.projetoId, projetoIds))
      }

      const whereClause = ataConditions.length > 0 ? and(...ataConditions) : undefined

      // Parallel queries: items + total + stats
      const [atas, totalResult, statsResult] = await Promise.all([
        db.query.ataSelecaoTable.findMany({
          where: whereClause,
          with: {
            projeto: {
              with: {
                professorResponsavel: true,
                departamento: true,
              },
            },
            geradoPor: true,
          },
          orderBy: [desc(ataSelecaoTable.dataGeracao)],
          limit: filters.limit,
          offset: filters.offset,
        }),
        db.select({ count: count() }).from(ataSelecaoTable).where(whereClause),
        this.getAtasStats(whereClause, projetoIds),
      ])

      const items = atas.map((ata) => ({
        id: ata.id,
        projetoId: ata.projetoId,
        projetoTitulo: ata.projeto.titulo,
        professorResponsavel: ata.projeto.professorResponsavel.nomeCompleto,
        departamento: ata.projeto.departamento?.sigla || ata.projeto.departamento?.nome,
        ano: ata.projeto.ano,
        semestre: ata.projeto.semestre,
        geradoPor: ata.geradoPor?.username,
        dataGeracao: ata.dataGeracao,
        assinado: ata.assinado,
        dataAssinatura: ata.dataAssinatura,
        status: ata.assinado ? 'ASSINADO' : 'RASCUNHO',
      }))

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        stats: statsResult,
      }
    },

    // Calculate stats for atas (ignoring status filter for accurate stats)
    async getAtasStats(
      _whereClause: ReturnType<typeof and> | undefined,
      projetoIds: number[] | undefined
    ): Promise<AtasStats> {
      // Get all atas matching projeto filters (ignoring status filter for stats)
      const baseCondition = projetoIds ? inArray(ataSelecaoTable.projetoId, projetoIds) : undefined

      const [totalResult, assinadoResult] = await Promise.all([
        db.select({ count: count() }).from(ataSelecaoTable).where(baseCondition),
        db
          .select({ count: count() })
          .from(ataSelecaoTable)
          .where(baseCondition ? and(baseCondition, eq(ataSelecaoTable.assinado, true)) : eq(ataSelecaoTable.assinado, true)),
      ])

      const total = totalResult[0]?.count ?? 0
      const assinado = assinadoResult[0]?.count ?? 0

      return {
        total,
        rascunho: total - assinado,
        assinado,
      }
    },
  }
}
