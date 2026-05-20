import type { db } from '@/server/db'
import {
  inscricaoTable,
  alunoTable,
  projetoTable,
  professorTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  vagaTable,
} from '@/server/db/schema'
import type { Semestre } from '@/types'
import { and, count, eq, isNull, desc, inArray } from 'drizzle-orm'

type Database = typeof db

// Types for admin pagination
export interface RelatorioAdminFilters {
  ano?: number
  semestre?: Semestre
  departamentoId?: number
  limit?: number
  offset?: number
}

export interface RelatorioDisciplinaAdminStats {
  total: number
  notCreated: number
  draft: number
  submitted: number
}

export interface RelatorioMonitorAdminStats {
  total: number
  draft: number
  pendingStudent: number
  complete: number
}

export function createRelatoriosFinaisRepository(database: Database) {
  return {
    // ========================================
    // RELATORIO FINAL DISCIPLINA
    // ========================================

    async findRelatorioDisciplinaById(id: number) {
      return database.query.relatorioFinalDisciplinaTable.findFirst({
        where: eq(relatorioFinalDisciplinaTable.id, id),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
          relatoriosMonitores: {
            with: {
              inscricao: {
                with: {
                  aluno: true,
                },
              },
            },
          },
        },
      })
    },

    async findRelatorioDisciplinaByProjetoId(projetoId: number) {
      return database.query.relatorioFinalDisciplinaTable.findFirst({
        where: eq(relatorioFinalDisciplinaTable.projetoId, projetoId),
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
          relatoriosMonitores: {
            with: {
              inscricao: {
                with: {
                  aluno: true,
                },
              },
            },
          },
        },
      })
    },

    async listRelatoriosDisciplinaByProfessor(professorId: number, ano?: number, semestre?: Semestre) {
      const conditions = [eq(projetoTable.professorResponsavelId, professorId), isNull(projetoTable.deletedAt)]

      if (ano) conditions.push(eq(projetoTable.ano, ano))
      if (semestre) conditions.push(eq(projetoTable.semestre, semestre))

      // Single query with relations
      const projetos = await database.query.projetoTable.findMany({
        where: and(...conditions),
        with: {
          professorResponsavel: true,
          relatorioFinal: {
            with: {
              relatoriosMonitores: true,
            },
          },
          vagas: true, // Get all vagas in one query
        },
        orderBy: [desc(projetoTable.ano), desc(projetoTable.createdAt)],
      })

      return projetos.map((projeto) => {
        const relatorio = projeto.relatorioFinal
        const totalMonitores = projeto.vagas?.length ?? 0

        if (relatorio) {
          const monitoresAssinados = relatorio.relatoriosMonitores.filter(
            (r: { alunoAssinouEm: Date | null; professorAssinouEm: Date | null }) =>
              r.alunoAssinouEm && r.professorAssinouEm
          ).length

          return {
            id: relatorio.id,
            projetoId: projeto.id,
            status: relatorio.status,
            professorAssinouEm: relatorio.professorAssinouEm,
            createdAt: relatorio.createdAt,
            projeto: {
              id: projeto.id,
              titulo: projeto.titulo,
              ano: projeto.ano,
              semestre: projeto.semestre,
              disciplinaNome: projeto.disciplinaNome,
            },
            totalMonitores,
            monitoresAssinados,
          }
        }

        // Projeto sem relatório criado ainda
        return {
          id: 0,
          projetoId: projeto.id,
          status: null,
          professorAssinouEm: null,
          createdAt: null,
          projeto: {
            id: projeto.id,
            titulo: projeto.titulo,
            ano: projeto.ano,
            semestre: projeto.semestre,
            disciplinaNome: projeto.disciplinaNome,
          },
          totalMonitores,
          monitoresAssinados: 0,
        }
      })
    },

    async createRelatorioDisciplina(data: {
      projetoId: number
      conteudo: string
      status?: string
    }) {
      const [created] = await database
        .insert(relatorioFinalDisciplinaTable)
        .values({
          projetoId: data.projetoId,
          conteudo: data.conteudo,
          status: (data.status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED') ?? 'DRAFT',
        })
        .returning()

      return created
    },

    async updateRelatorioDisciplina(
      id: number,
      data: {
        conteudo?: string
        status?: string
        professorAssinouEm?: Date | null
      }
    ) {
      const updateData: Record<string, unknown> = {}
      if (data.conteudo !== undefined) updateData.conteudo = data.conteudo
      if (data.status !== undefined) updateData.status = data.status
      if (data.professorAssinouEm !== undefined) updateData.professorAssinouEm = data.professorAssinouEm

      const [updated] = await database
        .update(relatorioFinalDisciplinaTable)
        .set(updateData)
        .where(eq(relatorioFinalDisciplinaTable.id, id))
        .returning()

      return updated
    },

    // ========================================
    // RELATORIO FINAL MONITOR
    // ========================================

    async findRelatorioMonitorById(id: number) {
      return database.query.relatorioFinalMonitorTable.findFirst({
        where: eq(relatorioFinalMonitorTable.id, id),
        with: {
          inscricao: {
            with: {
              aluno: true,
              projeto: {
                with: {
                  professorResponsavel: true,
                },
              },
            },
          },
          relatorioDisciplina: true,
        },
      })
    },

    async findRelatorioMonitorByInscricaoId(inscricaoId: number) {
      return database.query.relatorioFinalMonitorTable.findFirst({
        where: eq(relatorioFinalMonitorTable.inscricaoId, inscricaoId),
        with: {
          inscricao: {
            with: {
              aluno: true,
              projeto: {
                with: {
                  professorResponsavel: true,
                },
              },
            },
          },
          relatorioDisciplina: true,
        },
      })
    },

    async listRelatoriosMonitorByRelatorioDisciplinaId(relatorioDisciplinaId: number) {
      return database.query.relatorioFinalMonitorTable.findMany({
        where: eq(relatorioFinalMonitorTable.relatorioDisciplinaId, relatorioDisciplinaId),
        with: {
          inscricao: {
            with: {
              aluno: true,
              vaga: true,
            },
          },
        },
        orderBy: desc(relatorioFinalMonitorTable.createdAt),
      })
    },

    async listRelatoriosPendentesAssinaturaAluno(alunoId: number) {
      // Find all inscricoes for this student
      const inscricoes = await database.query.inscricaoTable.findMany({
        where: eq(inscricaoTable.alunoId, alunoId),
      })

      const inscricaoIds = inscricoes.map((i) => i.id)
      if (inscricaoIds.length === 0) return []

      // Use inArray instead of raw SQL to prevent SQL injection
      const relatorios = await database.query.relatorioFinalMonitorTable.findMany({
        where: and(
          inArray(relatorioFinalMonitorTable.inscricaoId, inscricaoIds),
          eq(relatorioFinalMonitorTable.status, 'SUBMITTED'),
          isNull(relatorioFinalMonitorTable.alunoAssinouEm)
        ),
        with: {
          inscricao: {
            with: {
              aluno: true,
              projeto: {
                with: {
                  professorResponsavel: true,
                },
              },
            },
          },
          relatorioDisciplina: true,
        },
        orderBy: desc(relatorioFinalMonitorTable.createdAt),
      })

      return relatorios
    },

    async createRelatorioMonitor(data: {
      inscricaoId: number
      relatorioDisciplinaId: number
      conteudo: string
      status?: string
    }) {
      const [created] = await database
        .insert(relatorioFinalMonitorTable)
        .values({
          inscricaoId: data.inscricaoId,
          relatorioDisciplinaId: data.relatorioDisciplinaId,
          conteudo: data.conteudo,
          status: (data.status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED') ?? 'DRAFT',
        })
        .returning()

      return created
    },

    async updateRelatorioMonitor(
      id: number,
      data: {
        conteudo?: string
        status?: string
        alunoAssinouEm?: Date | null
        professorAssinouEm?: Date | null
      }
    ) {
      const updateData: Record<string, unknown> = {}
      if (data.conteudo !== undefined) updateData.conteudo = data.conteudo
      if (data.status !== undefined) updateData.status = data.status
      if (data.alunoAssinouEm !== undefined) updateData.alunoAssinouEm = data.alunoAssinouEm
      if (data.professorAssinouEm !== undefined) updateData.professorAssinouEm = data.professorAssinouEm

      const [updated] = await database
        .update(relatorioFinalMonitorTable)
        .set(updateData)
        .where(eq(relatorioFinalMonitorTable.id, id))
        .returning()

      return updated
    },

    // ========================================
    // HELPER QUERIES
    // ========================================

    async findProjetoById(projetoId: number) {
      return database.query.projetoTable.findFirst({
        where: and(eq(projetoTable.id, projetoId), isNull(projetoTable.deletedAt)),
        with: {
          professorResponsavel: true,
        },
      })
    },

    async findInscricaoById(inscricaoId: number) {
      return database.query.inscricaoTable.findFirst({
        where: eq(inscricaoTable.id, inscricaoId),
        with: {
          aluno: true,
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
          vaga: true,
        },
      })
    },

    async findProfessorByUserId(userId: number) {
      return database.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },

    async findAlunoByUserId(userId: number) {
      return database.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, userId),
      })
    },

    async listMonitoresAceitosByProjetoId(projetoId: number) {
      // Get all vagas (accepted monitors) for this project
      const vagas = await database.query.vagaTable.findMany({
        where: eq(vagaTable.projetoId, projetoId),
        with: {
          aluno: true,
          inscricao: true,
        },
      })

      return vagas
    },

    // ========================================
    // ADMIN QUERIES (PAGINATED)
    // ========================================

    async listAllDisciplinaReportsForAdmin(filters: RelatorioAdminFilters) {
      const conditions: ReturnType<typeof eq>[] = [isNull(projetoTable.deletedAt)]

      if (filters.ano) conditions.push(eq(projetoTable.ano, filters.ano))
      if (filters.semestre) conditions.push(eq(projetoTable.semestre, filters.semestre))
      if (filters.departamentoId) conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))

      // Count total
      const totalResult = await database
        .select({ count: count() })
        .from(projetoTable)
        .where(and(...conditions))

      const total = totalResult[0]?.count ?? 0

      // Get paginated projects
      const projetos = await database.query.projetoTable.findMany({
        where: and(...conditions),
        with: {
          professorResponsavel: true,
          departamento: true,
          relatorioFinal: {
            with: {
              relatoriosMonitores: true,
            },
          },
        },
        orderBy: [desc(projetoTable.ano), desc(projetoTable.createdAt)],
        limit: filters.limit,
        offset: filters.offset,
      })

      const items = projetos.map((projeto) => {
        const relatorio = projeto.relatorioFinal
        return {
          projetoId: projeto.id,
          projetoTitulo: projeto.titulo,
          disciplinaNome: projeto.disciplinaNome,
          professorNome: projeto.professorResponsavel.nomeCompleto,
          departamento: projeto.departamento?.sigla || projeto.departamento?.nome,
          ano: projeto.ano,
          semestre: projeto.semestre,
          relatorioId: relatorio?.id || null,
          status: relatorio?.status || 'NOT_CREATED',
          professorAssinouEm: relatorio?.professorAssinouEm,
          totalMonitores: relatorio?.relatoriosMonitores.length || 0,
          createdAt: relatorio?.createdAt,
        }
      })

      // Calculate stats from all matching projects (no pagination)
      const stats = await this.getDisciplinaReportsStats(conditions)

      return { items, total, stats }
    },

    async getDisciplinaReportsStats(conditions: ReturnType<typeof eq>[]): Promise<RelatorioDisciplinaAdminStats> {
      const allProjetos = await database.query.projetoTable.findMany({
        where: and(...conditions),
        columns: { id: true },
        with: {
          relatorioFinal: {
            columns: { status: true },
          },
        },
      })

      let notCreated = 0
      let draft = 0
      let submitted = 0

      for (const projeto of allProjetos) {
        if (!projeto.relatorioFinal) {
          notCreated++
        } else if (projeto.relatorioFinal.status === 'DRAFT') {
          draft++
        } else {
          submitted++
        }
      }

      return {
        total: allProjetos.length,
        notCreated,
        draft,
        submitted,
      }
    },

    async listAllMonitorReportsForAdmin(filters: RelatorioAdminFilters) {
      // Build conditions for projeto filter
      const projetoConditions: ReturnType<typeof eq>[] = [isNull(projetoTable.deletedAt)]

      if (filters.ano) projetoConditions.push(eq(projetoTable.ano, filters.ano))
      if (filters.semestre) projetoConditions.push(eq(projetoTable.semestre, filters.semestre))
      if (filters.departamentoId) projetoConditions.push(eq(projetoTable.departamentoId, filters.departamentoId))

      // Get projeto IDs that match filters
      const projetos = await database
        .select({ id: projetoTable.id })
        .from(projetoTable)
        .where(and(...projetoConditions))

      const projetoIds = projetos.map((p) => p.id)
      if (projetoIds.length === 0) {
        return {
          items: [],
          total: 0,
          stats: { total: 0, draft: 0, pendingStudent: 0, complete: 0 },
        }
      }

      // Get inscricao IDs for these projects
      const inscricoes = await database
        .select({ id: inscricaoTable.id })
        .from(inscricaoTable)
        .where(inArray(inscricaoTable.projetoId, projetoIds))

      const inscricaoIds = inscricoes.map((i) => i.id)
      if (inscricaoIds.length === 0) {
        return {
          items: [],
          total: 0,
          stats: { total: 0, draft: 0, pendingStudent: 0, complete: 0 },
        }
      }

      // Count total reports
      const totalResult = await database
        .select({ count: count() })
        .from(relatorioFinalMonitorTable)
        .where(inArray(relatorioFinalMonitorTable.inscricaoId, inscricaoIds))

      const total = totalResult[0]?.count ?? 0

      // Get paginated reports
      const relatorios = await database.query.relatorioFinalMonitorTable.findMany({
        where: inArray(relatorioFinalMonitorTable.inscricaoId, inscricaoIds),
        with: {
          inscricao: {
            with: {
              aluno: true,
              projeto: {
                with: {
                  professorResponsavel: true,
                  departamento: true,
                },
              },
              vaga: true,
            },
          },
          relatorioDisciplina: true,
        },
        orderBy: desc(relatorioFinalMonitorTable.createdAt),
        limit: filters.limit,
        offset: filters.offset,
      })

      const items = relatorios.map((r) => ({
        id: r.id,
        monitorNome: r.inscricao.aluno.nomeCompleto,
        monitorMatricula: r.inscricao.aluno.matricula,
        projetoId: r.inscricao.projetoId,
        projetoTitulo: r.inscricao.projeto.titulo,
        disciplinaNome: r.inscricao.projeto.disciplinaNome,
        professorNome: r.inscricao.projeto.professorResponsavel.nomeCompleto,
        departamento: r.inscricao.projeto.departamento?.sigla || r.inscricao.projeto.departamento?.nome,
        tipo: r.inscricao.vaga?.tipo || r.inscricao.tipoVagaPretendida,
        ano: r.inscricao.projeto.ano,
        semestre: r.inscricao.projeto.semestre,
        status: r.status,
        alunoAssinouEm: r.alunoAssinouEm,
        professorAssinouEm: r.professorAssinouEm,
        createdAt: r.createdAt,
      }))

      // Calculate stats
      const stats = await this.getMonitorReportsStats(inscricaoIds)

      return { items, total, stats }
    },

    async getMonitorReportsStats(inscricaoIds: number[]): Promise<RelatorioMonitorAdminStats> {
      if (inscricaoIds.length === 0) {
        return { total: 0, draft: 0, pendingStudent: 0, complete: 0 }
      }

      const allRelatorios = await database
        .select({
          status: relatorioFinalMonitorTable.status,
          alunoAssinouEm: relatorioFinalMonitorTable.alunoAssinouEm,
          professorAssinouEm: relatorioFinalMonitorTable.professorAssinouEm,
        })
        .from(relatorioFinalMonitorTable)
        .where(inArray(relatorioFinalMonitorTable.inscricaoId, inscricaoIds))

      let draft = 0
      let pendingStudent = 0
      let complete = 0

      for (const r of allRelatorios) {
        if (r.status === 'DRAFT') {
          draft++
        } else if (r.professorAssinouEm && !r.alunoAssinouEm) {
          pendingStudent++
        } else if (r.professorAssinouEm && r.alunoAssinouEm) {
          complete++
        }
      }

      return {
        total: allRelatorios.length,
        draft,
        pendingStudent,
        complete,
      }
    },
  }
}

export type RelatoriosFinaisRepository = ReturnType<typeof createRelatoriosFinaisRepository>
