import { and, eq, sql, type ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { db } from '@/server/db'
import * as schema from '@/server/db/schema'
import {
  alunoTable,
  assinaturaDocumentoTable,
  projetoDocumentoTable,
  projetoTable,
  vagaTable,
} from '@/server/db/schema'
import type { SignatureTypeTermo } from '@/types'

type Database = typeof db
type Transaction = PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>

export function createTermosRepository(db: Database | Transaction) {
  return {
    async findVagaById(vagaId: number) {
      return db.query.vagaTable.findFirst({
        where: eq(vagaTable.id, vagaId),
        with: {
          aluno: {
            with: { user: true },
          },
          projeto: {
            with: {
              departamento: true,
              professorResponsavel: {
                with: { user: true },
              },
              disciplinas: {
                with: {
                  disciplina: true,
                },
              },
            },
          },
        },
      })
    },

    async findVagaSimple(vagaId: number) {
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

    async findVagasByProjetoId(projetoId: number) {
      return db.query.vagaTable.findMany({
        where: eq(vagaTable.projetoId, projetoId),
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

    async findSignature(vagaId: number, tipoAssinatura: SignatureTypeTermo) {
      return db.query.assinaturaDocumentoTable.findFirst({
        where: and(
          eq(assinaturaDocumentoTable.vagaId, vagaId),
          eq(assinaturaDocumentoTable.tipoAssinatura, tipoAssinatura)
        ),
      })
    },

    async findSignaturesByVagaId(vagaId: number) {
      return db.query.assinaturaDocumentoTable.findMany({
        where: eq(assinaturaDocumentoTable.vagaId, vagaId),
        with: {
          user: true,
        },
      })
    },

    async insertSignature(userId: number, vagaId: number, assinaturaData: string, tipoAssinatura: SignatureTypeTermo) {
      await db.insert(assinaturaDocumentoTable).values({
        assinaturaData,
        tipoAssinatura,
        userId,
        vagaId,
      })
    },

    async insertProjetoDocumento(projetoId: number, fileId: string, observacoes?: string) {
      await db.insert(projetoDocumentoTable).values({
        projetoId,
        fileId,
        tipoDocumento: 'ATA_SELECAO',
        observacoes,
      })
    },

    async findVagasForStudent(userId: number) {
      return db.query.vagaTable.findMany({
        where: sql`${vagaTable.alunoId} IN (
          SELECT id FROM ${alunoTable} WHERE ${alunoTable.userId} = ${userId}
        )`,
        with: {
          projeto: {
            columns: {
              titulo: true,
            },
            with: {
              professorResponsavel: true,
            },
          },
          aluno: true,
        },
      })
    },

    async findVagasForProfessor(userId: number) {
      return db.query.vagaTable.findMany({
        where: sql`${vagaTable.projetoId} IN (
          SELECT id FROM ${projetoTable} WHERE ${projetoTable.professorResponsavelId} = ${userId}
        )`,
        with: {
          projeto: true,
          aluno: {
            with: { user: true },
          },
        },
      })
    },

    async findAllVagas() {
      return db.query.vagaTable.findMany({
        with: {
          projeto: {
            with: {
              professorResponsavel: true,
            },
          },
          aluno: {
            with: { user: true },
          },
        },
      })
    },
  }
}

export type TermosRepository = ReturnType<typeof createTermosRepository>
