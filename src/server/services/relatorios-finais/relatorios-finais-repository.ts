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
import { and, eq, isNull, desc, inArray } from 'drizzle-orm'

type Database = typeof db

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
    // ADMIN QUERIES
    // ========================================

    async listAllDisciplinaReportsForAdmin(filters: { ano?: number; semestre?: Semestre; departamentoId?: number }) {
      const conditions = [isNull(projetoTable.deletedAt)]

      if (filters.ano) conditions.push(eq(projetoTable.ano, filters.ano))
      if (filters.semestre) conditions.push(eq(projetoTable.semestre, filters.semestre))
      if (filters.departamentoId) conditions.push(eq(projetoTable.departamentoId, filters.departamentoId))

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
      })

      return projetos.map((projeto) => {
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
    },

    async listAllMonitorReportsForAdmin(filters: { ano?: number; semestre?: Semestre; departamentoId?: number }) {
      const projetos = await database.query.projetoTable.findMany({
        where: isNull(projetoTable.deletedAt),
        with: {
          professorResponsavel: true,
          departamento: true,
        },
      })

      // Filter projects
      let filteredProjetos = projetos
      if (filters.ano) filteredProjetos = filteredProjetos.filter((p) => p.ano === filters.ano)
      if (filters.semestre) filteredProjetos = filteredProjetos.filter((p) => p.semestre === filters.semestre)
      if (filters.departamentoId)
        filteredProjetos = filteredProjetos.filter((p) => p.departamentoId === filters.departamentoId)

      const projetoIds = filteredProjetos.map((p) => p.id)
      if (projetoIds.length === 0) return []

      // Get all monitor reports for these projects
      const relatorios = await database.query.relatorioFinalMonitorTable.findMany({
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
      })

      // Filter by project IDs
      const filteredRelatorios = relatorios.filter((r) => projetoIds.includes(r.inscricao.projetoId))

      return filteredRelatorios.map((r) => ({
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
    },
  }
}

export type RelatoriosFinaisRepository = ReturnType<typeof createRelatoriosFinaisRepository>
