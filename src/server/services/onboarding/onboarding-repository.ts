import type { db } from '@/server/db'
import { alunoTable, professorTable, userTable } from '@/server/db/schema'
import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'

type Database = typeof db

export type AlunoInsert = InferInsertModel<typeof alunoTable>
export type ProfessorInsert = InferInsertModel<typeof professorTable>
export type AlunoUpdate = Partial<AlunoInsert>
export type ProfessorUpdate = Partial<ProfessorInsert>

export function createOnboardingRepository(db: Database) {
  return {
    async findStudentProfile(userId: number) {
      return db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, userId),
      })
    },

    async findProfessorProfile(userId: number) {
      return db.query.professorTable.findFirst({
        where: eq(professorTable.userId, userId),
      })
    },

    async findUser(userId: number) {
      return db.query.userTable.findFirst({
        where: eq(userTable.id, userId),
      })
    },

    async createStudentProfile(data: AlunoInsert) {
      const [profile] = await db.insert(alunoTable).values(data).returning({ id: alunoTable.id })
      return profile
    },

    async createProfessorProfile(data: ProfessorInsert) {
      const [profile] = await db.insert(professorTable).values(data).returning({ id: professorTable.id })
      return profile
    },

    async updateStudentDocument(userId: number, data: AlunoUpdate) {
      await db.update(alunoTable).set(data).where(eq(alunoTable.userId, userId))
    },

    async updateProfessorDocument(userId: number, data: ProfessorUpdate) {
      await db.update(professorTable).set(data).where(eq(professorTable.userId, userId))
    },
  }
}

export type OnboardingRepository = ReturnType<typeof createOnboardingRepository>
