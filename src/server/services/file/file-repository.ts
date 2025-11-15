import { eq, or } from 'drizzle-orm'
import type { db } from '@/server/db'
import { alunoTable, professorTable, projetoDocumentoTable, projetoTable } from '@/server/db/schema'

type Database = typeof db

export function createFileRepository(db: Database) {
  return {
    async findAlunoByFileId(fileId: string) {
      return db.query.alunoTable.findFirst({
        where: or(eq(alunoTable.historicoEscolarFileId, fileId), eq(alunoTable.comprovanteMatriculaFileId, fileId)),
      })
    },

    async findProfessorByFileId(fileId: string) {
      return db.query.professorTable.findFirst({
        where: or(
          eq(professorTable.curriculumVitaeFileId, fileId),
          eq(professorTable.comprovanteVinculoFileId, fileId)
        ),
      })
    },

    async findProjetoDocumentoByFileId(fileId: string) {
      return db.query.projetoDocumentoTable.findFirst({
        where: eq(projetoDocumentoTable.fileId, fileId),
        with: {
          projeto: {
            with: {
              professoresParticipantes: true,
            },
          },
        },
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

    async findProfessorByUserId(userId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },
  }
}

export type FileRepository = ReturnType<typeof createFileRepository>
