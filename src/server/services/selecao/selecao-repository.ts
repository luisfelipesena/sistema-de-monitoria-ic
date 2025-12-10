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
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'

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
    // ADMIN QUERIES
    // ========================================

    async findAllProjectsWithSelectionStatus(filters: { ano?: number; semestre?: Semestre; departamentoId?: number }) {
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

      const projetos = await db.query.projetoTable.findMany({
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
      })

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

      return projetos.map((projeto) => {
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
    },

    async findAllAtasForAdmin(filters: {
      ano?: number
      semestre?: Semestre
      departamentoId?: number
      status?: 'DRAFT' | 'SIGNED'
    }) {
      const atas = await db.query.ataSelecaoTable.findMany({
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
      })

      let filtered = atas

      // Filter by projeto attributes
      if (filters.ano) {
        filtered = filtered.filter((a) => a.projeto.ano === filters.ano)
      }
      if (filters.semestre) {
        filtered = filtered.filter((a) => a.projeto.semestre === filters.semestre)
      }
      if (filters.departamentoId) {
        filtered = filtered.filter((a) => a.projeto.departamentoId === filters.departamentoId)
      }

      // Filter by ata status (only DRAFT and SIGNED since no publicado column)
      if (filters.status) {
        if (filters.status === 'SIGNED') {
          filtered = filtered.filter((a) => a.assinado)
        } else if (filters.status === 'DRAFT') {
          filtered = filtered.filter((a) => !a.assinado)
        }
      }

      return filtered.map((ata) => ({
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
    },
  }
}
