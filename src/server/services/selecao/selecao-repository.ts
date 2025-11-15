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
import { PROJETO_STATUS_APPROVED, STATUS_INSCRICAO_SUBMITTED } from '@/types'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { and, desc, eq, isNotNull } from 'drizzle-orm'

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
          eq(assinaturaDocumentoTable.tipoAssinatura, 'ATA_SELECAO_PROFESSOR')
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
  }
}
