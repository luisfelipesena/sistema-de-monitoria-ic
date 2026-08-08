import type { db } from '@/server/db'
import { alunoTable, assinaturaDocumentoTable, inscricaoTable, professorTable, projetoTable, vagaTable } from '@/server/db/schema'
import type { Semestre, StatusInscricao } from '@/types'
import { TIPO_VAGA_BOLSISTA } from '@/types'
import type { InferInsertModel } from 'drizzle-orm'
import { and, desc, eq, sql } from 'drizzle-orm'

export type VagaInsert = InferInsertModel<typeof vagaTable>

type Database = typeof db

export function createVagasRepository(db: Database) {
  return {
    async findBolsaExistente(alunoId: number, ano: number, semestre: Semestre, tipoBolsa: typeof TIPO_VAGA_BOLSISTA) {
      const rows = await db
        .select({
          vaga: vagaTable,
          projeto: projetoTable,
        })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(vagaTable.alunoId, alunoId),
            eq(vagaTable.tipo, tipoBolsa),
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre)
          )
        )
        .limit(1)

      if (rows.length === 0) return null
      return {
        ...rows[0].vaga,
        projeto: rows[0].projeto,
      }
    },

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

    async findVagaByInscricaoId(inscricaoId: number) {
      return db.query.vagaTable.findFirst({
        where: eq(vagaTable.inscricaoId, inscricaoId),
      })
    },

    async insertVaga(data: VagaInsert) {
      const [vaga] = await db.insert(vagaTable).values(data).returning()
      return vaga
    },

    async updateInscricaoStatus(inscricaoId: number, status: StatusInscricao, feedbackProfessor?: string) {
      await db
        .update(inscricaoTable)
        .set({
          status,
          feedbackProfessor,
          updatedAt: new Date(),
        })
        .where(eq(inscricaoTable.id, inscricaoId))
    },

    async findVagasByAlunoUserId(userId: number) {
      const aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, userId),
      })
      if (!aluno) return []

      return db.query.vagaTable.findMany({
        where: eq(vagaTable.alunoId, aluno.id),
        with: {
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: { user: true },
              },
            },
          },
          aluno: {
            with: { user: true },
          },
        },
        orderBy: [desc(vagaTable.createdAt)],
      })
    },

    async findProfessorByUserId(userId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },

    async findProjetoById(projetoId: number) {
      return db.query.projetoTable.findFirst({
        where: eq(projetoTable.id, projetoId),
        with: {
          professorResponsavel: true,
        },
      })
    },

    async findVagasByProjetoId(projetoId: number) {
      return db.query.vagaTable.findMany({
        where: eq(vagaTable.projetoId, projetoId),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: true,
        },
        orderBy: [desc(vagaTable.createdAt)],
      })
    },

    async findVagasWithFilters(
      whereConditions: ReturnType<typeof and> | ReturnType<typeof eq> | ReturnType<typeof sql> | undefined
    ) {
      return db.query.vagaTable.findMany({
        where: whereConditions,
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

    async findAssinaturasByVagaId(vagaId: number) {
      return db.query.assinaturaDocumentoTable.findMany({
        where: eq(assinaturaDocumentoTable.vagaId, vagaId),
      })
    },

    async findVagaByIdWithRelations(vagaId: number) {
      return db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, vagaId),
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

    async updateVaga(vagaId: number, data: Partial<VagaInsert>) {
      await db
        .update(vagaTable)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(vagaTable.id, vagaId))
    },
  }
}

export type VagasRepository = ReturnType<typeof createVagasRepository>
